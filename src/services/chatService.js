import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadInitialRestaurants } from '../data/runtimeRestaurants';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash-8b";

let genAI = null;
let model = null;
let currentModelName = GEMINI_MODEL;
let systemInstructionPromise = null;

const initializeGemini = () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
        console.warn("Gemini API Key is missing. AI features will not work.");
        return false;
    }

    console.log(`Initializing Gemini with Key: ${GEMINI_API_KEY.substring(0, 8)}... using model: ${currentModelName}`);

    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const candidates = Array.from(new Set([
            GEMINI_MODEL,
            "gemini-1.5-flash-8b",
            "gemini-1.5-flash",
            "gemini-1.0-pro",
        ])).filter(Boolean);

        let lastError = null;

        for (const name of candidates) {
            try {
                currentModelName = name;
                model = genAI.getGenerativeModel({ model: name });
                console.log(`Gemini initialized with model: ${name}`);
                return true;
            } catch (error) {
                lastError = error;
                console.error(`Failed to initialize model ${name}:`, error);
            }
        }

        if (lastError) {
            throw lastError;
        }

        return false;
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
        return false;
    }
};

const buildRestaurantSummary = (restaurants) =>
    JSON.stringify(
        restaurants
            .map((restaurant) => ({
                id: restaurant.id,
                name: restaurant.name,
                tags: restaurant.tags || [],
                category: restaurant.category || [],
                intro: restaurant.intro_zh || restaurant.intro_en,
                opening_hours: restaurant.opening_hours,
                level: restaurant.subscriptionLevel || 0,
                stalls: restaurant.subStalls
                    ? restaurant.subStalls.map((stall) => (typeof stall === 'object' ? stall.name : stall)).filter(Boolean)
                    : [],
            }))
            .slice(0, 500),
    );

const buildSystemInstruction = async () => {
    if (!systemInstructionPromise) {
        systemInstructionPromise = loadInitialRestaurants().then((restaurants) => `
You are "Kulai Food Expert". Base every recommendation only on the provided Kulai restaurant dataset.

Recommendation rules:
0. Prioritize higher subscription levels first: 3 > 2 > 1.
1. If the user mentions being sick, sore throat, or wanting something light, prioritize restaurants with tags related to light food, porridge, or soup noodles.
2. If the user wants meat or strong flavors, prioritize bak kut teh, fried chicken, or claypot chicken rice.
3. If the user wants supper or late-night food, prioritize restaurants tagged for supper or described as suitable after dinner hours.
4. If the user wants family meals, elders, banquets, or large gatherings, prioritize spacious Chinese restaurants, seafood spots, and banquet-style venues.
5. If the user wants to hang out with friends, cafe vibes, or chat, prioritize cafes, western food, or dessert shops. Avoid banquet-style venues unless explicitly requested.
6. If the user wants cheap or budget food, prioritize coffee shops, hawker-style stalls, roadside food, Indian stalls, or Malay food. Avoid cafes and western food unless clearly budget-friendly.

Reply rules:
- Be warm and concise.
- Recommend 1 to 3 restaurants each time.
- When mentioning a restaurant name, you must wrap it in [[ID:Restaurant Name]] format. Example: [[10:Daily Wanton Mee]].
- If the question is unrelated to Kulai food, gently guide the user back to food recommendations.
- Keep responses short and practical.
- You must search deeply through sub-stalls/stalls. If a user asks for a specific stall food and it exists inside a venue, say which venue contains it.

Restaurant summary:
${buildRestaurantSummary(restaurants)}
`);
    }

    return systemInstructionPromise;
};

export const getGeminiResponse = async (userMessage, chatHistory = []) => {
    if (!model) {
        const success = initializeGemini();
        if (!success) {
            return {
                text: "Please configure `VITE_GEMINI_API_KEY` to use the AI assistant.",
                error: true,
            };
        }
    }

    try {
        const systemInstruction = await buildSystemInstruction();
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will recommend food spots based on the provided Kulai dataset." }],
                },
                ...chatHistory.map((message) => ({
                    role: message.role === 'user' ? 'user' : 'model',
                    parts: [{ text: message.content }],
                })),
            ],
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request Timeout")), 30000),
        );

        const result = await Promise.race([
            chat.sendMessage(userMessage),
            timeoutPromise,
        ]);

        const response = await result.response;
        const text = response.text();

        return { text, error: false };
    } catch (error) {
        console.error(`Gemini API Error (${currentModelName}):`, error);

        if ((error.message?.includes('503') || error.message?.includes('Timeout')) && currentModelName === "gemini-1.5-flash") {
            console.warn("Retrying gemini-1.5-flash...");
            return getGeminiResponse(userMessage, chatHistory);
        }

        let errorMsg = `AI is temporarily unavailable. (${error.message || "Unknown Error"})`;

        if (error.message?.includes('403')) {
            errorMsg = "The API key is invalid or out of quota (Error 403).";
        } else if (error.message?.includes('429')) {
            errorMsg = "Too many requests or the free quota has been exhausted (Error 429).";
        } else if (error.message?.includes('404')) {
            errorMsg = `Model not found (${currentModelName}). Check model access in Google AI Studio.`;
        } else if (error.message?.includes('Timeout')) {
            errorMsg = "The AI request timed out. Please try again shortly.";
        }

        return {
            text: errorMsg,
            error: true,
        };
    }
};
