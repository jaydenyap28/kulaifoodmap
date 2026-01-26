import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || "AIzaSyAuSMQcGfQtqS3D9rFc0t2rcR598ZMUKow";

console.log(`Testing API Key: ${API_KEY.substring(0, 10)}...`);

const genAI = new GoogleGenerativeAI(API_KEY);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-1.0-pro"
];

async function testModels() {
    for (const modelName of models) {
        console.log(`\n--- Testing ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName}`);
            console.log(`Response: ${response.text().substring(0, 50)}...`);
        } catch (error) {
            console.log(`❌ FAILED: ${modelName}`);
             if (error.message.includes("404")) {
                console.log("Error: 404 Not Found (Model likely not supported or no access)");
            } else if (error.message.includes("429")) {
                console.log("Error: 429 Too Many Requests (Quota exceeded)");
            } else {
                console.log(`Error: ${error.message.substring(0, 100)}...`);
            }
        }
    }
}

testModels();
