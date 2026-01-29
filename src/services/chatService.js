import { GoogleGenerativeAI } from "@google/generative-ai";
import { initialRestaurants } from '../data/restaurants';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyD_Gj5Ia18ZKXxc7lQVFYmiZTJJtKN6iTY"; 
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash-8b";

let genAI = null;
let model = null;
let currentModelName = GEMINI_MODEL;

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
            "gemini-1.0-pro"
        ])).filter(Boolean);

        let lastError = null;

        for (const name of candidates) {
            try {
                currentModelName = name;
                model = genAI.getGenerativeModel({ model: name });
                console.log(`Gemini initialized with model: ${name}`);
                return true;
            } catch (err) {
                lastError = err;
                console.error(`Failed to initialize model ${name}:`, err);
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

const SYSTEM_INSTRUCTION = `
你是“古来美食专家”，你的所有建议必须基于我提供的 restaurants.js 数据。

**推荐逻辑：**
0. **商业优先**：优先推荐 subscriptionLevel (等级) 较高的商家。等级 3 (Top Tier) > 等级 2 (Mid Tier) > 等级 1 (Normal)。在推荐时，优先提及这些高等级商家。
1. **健康/生病**：用户提到“喉咙痛”、“生病”、“清淡”时，优先推荐 tags 含“清淡”、“粥”、“汤面”的店（如林仙）。
2. **重口味/肉食**：用户提到“想吃肉”、“重口味”时，推荐“肉骨茶”、“炸鸡”、“砂锅鸡饭”。
3. **宵夜**：用户提到“宵夜”、“半夜”时，搜索 tags 含“宵夜”或简介提到“晚餐以后”的店（如日记云吞面、Roti King）。
4. **家庭/长辈/宴席**：用户提到“家庭聚餐”、“带长辈”、“宴会”、“酒楼”时，推荐“酒楼”、“煮炒”或空间大的中餐厅（如聚缘大酒家、国泰）。
5. **朋友/年轻人/聚会**：用户提到“聚会”、“朋友”、“氛围”、“Cafe”、“聊天”时，优先推荐环境好的“Cafe”、“西餐”或“甜点店”。**注意**：不要推荐“酒楼”或“大排档”，除非用户特别要求。
6. **价格/平价**：用户提到“便宜”、“平价”、“经济”、“Budget”时，优先推荐“咖啡店/美食阁”、“路边摊/餐车”、“印度档”或“马来餐”。尽量避免推荐“Cafe”或“西餐”，除非它们有明确的平价标签。

**回复规则：**
- 语气亲切自然，像个本地老饕。
- 每次推荐 1-3 家最符合的餐厅。
- **重要**：在提到餐厅名字时，必须使用特殊格式 [[ID:餐厅名]] 包裹。例如：[[10:日记云吞面]] 或 [[144:Roti King]]。这样系统才能生成可点击的链接。
- 如果用户的问题与古来美食无关，礼貌地引导回美食话题。
- 简短扼要，不要长篇大论。
- **档口搜索**：如果用户搜索特定的街头美食（如面煎糕、鸡饭档），请检查商家的 stalls 字段。如果找到，请明确告知用户该美食位于哪家咖啡店/美食中心内。

**可用餐厅数据摘要：**
${JSON.stringify(initialRestaurants.map(r => ({
    id: r.id,
    name: r.name,
    tags: r.tags || [],
    category: r.category || [],
    intro: r.intro_zh || r.intro_en,
    opening_hours: r.opening_hours,
    level: r.subscriptionLevel || 0,
    stalls: r.subStalls ? r.subStalls.map(s => s.name).filter(n => n) : []
})).slice(0, 500))} (数据截取部分，实际包含更多)
`;

export const getGeminiResponse = async (userMessage, chatHistory = []) => {
    if (!model) {
        const success = initializeGemini();
        if (!success) {
            return {
                text: "⚠️ 请在 `src/services/chatService.js` 中填入您的 Google Gemini API Key 才能使用 AI 助手功能。",
                error: true
            };
        }
    }

    try {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_INSTRUCTION }],
                },
                {
                    role: "model",
                    parts: [{ text: "收到，我是古来美食专家。我会根据提供的数据和逻辑为您推荐美食。请问您今天想吃什么？" }],
                },
                ...chatHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ],
        });

        // Add timeout race
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request Timeout")), 30000) // 30s Timeout
        );

        const result = await Promise.race([
            chat.sendMessage(userMessage),
            timeoutPromise
        ]);

        const response = await result.response;
        const text = response.text();
        
        return { text, error: false };
    } catch (error) {
        console.error(`Gemini API Error (${currentModelName}):`, error);

        // Auto-fallback strategy for 404 (Model Not Found) or 503 (Overloaded) or Timeout
        // If 1.5-flash fails, try retrying it once OR try standard gemini-pro (if available) 
        // BUT gemini-pro is 404ing. So let's just Retry 1.5-flash or fail gracefully.
        if ((error.message?.includes('503') || error.message?.includes('Timeout')) && currentModelName === "gemini-1.5-flash") {
             console.warn("Retrying gemini-1.5-flash...");
             // Simple retry logic (could be improved with counter)
             // For now, just one retry.
             return getGeminiResponse(userMessage, chatHistory); 
        }
        
        // Detailed error for debugging
        let errorMsg = `抱歉，AI 暂时无法连接。(${error.message || "Unknown Error"})`;
        
        if (error.message?.includes('403')) {
             errorMsg = "API Key 无效或超出配额 (Error 403)。请检查 Key 设置。";
        } else if (error.message?.includes('429')) {
             errorMsg = "请求过于频繁，或该模型的免费额度已用完 (Error 429)。建议稍后再试。";
        } else if (error.message?.includes('404')) {
             errorMsg = `模型未找到 (${currentModelName})。这通常意味着您的 API Key 所在项目没有启用该模型的权限，或该模型在您的地区不可用。建议在 Google AI Studio 中检查模型访问权限。`;
        } else if (error.message?.includes('Timeout')) {
             errorMsg = "请求超时。AI 响应太慢，请稍后再试。";
        }

        return {
            text: errorMsg,
            error: true
        };
    }
};
