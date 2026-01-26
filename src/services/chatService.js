import { GoogleGenerativeAI } from "@google/generative-ai";
import { initialRestaurants } from '../data/restaurants';

// TODO: Replace with your actual Gemini API Key
const GEMINI_API_KEY = "AIzaSyAWhT-QzIB45n3dqOr2Tup5rGNHDpNcjfY"; 

let genAI = null;
let model = null;

const initializeGemini = () => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
        console.warn("Gemini API Key is missing. AI features will not work.");
        return false;
    }
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Use gemini-2.0-flash for better performance and availability
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        return true;
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
        return false;
    }
};

const SYSTEM_INSTRUCTION = `
你是“古来美食专家”，你的所有建议必须基于我提供的 restaurants.js 数据。

**推荐逻辑：**
1. **健康/生病**：用户提到“喉咙痛”、“生病”、“清淡”时，优先推荐 tags 含“清淡”、“粥”、“汤面”的店（如林仙、聚缘生鱼片）。
2. **重口味/肉食**：用户提到“想吃肉”、“重口味”时，推荐“肉骨茶”、“炸鸡”、“砂锅鸡饭”。
3. **宵夜**：用户提到“宵夜”、“半夜”时，搜索 tags 含“宵夜”或简介提到“晚餐以后”的店（如日记云吞面、Roti King）。
4. **家庭/聚餐**：用户提到“小孩”、“家庭聚餐”时，推荐空间大、有“多样化选择”或“酒楼”标签的店。

**回复规则：**
- 语气亲切自然，像个本地老饕。
- 每次推荐 1-3 家最符合的餐厅。
- **重要**：在提到餐厅名字时，必须使用特殊格式 [[ID:餐厅名]] 包裹。例如：[[10:日记云吞面]] 或 [[144:Roti King]]。这样系统才能生成可点击的链接。
- 如果用户的问题与古来美食无关，礼貌地引导回美食话题。
- 简短扼要，不要长篇大论。

**可用餐厅数据摘要：**
${JSON.stringify(initialRestaurants.map(r => ({
    id: r.id,
    name: r.name,
    tags: r.tags || [],
    category: r.category || [],
    intro: r.intro_zh || r.intro_en,
    opening_hours: r.opening_hours
})).slice(0, 100))} (数据截取部分，实际包含更多)
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

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();
        
        return { text, error: false };
    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            text: "抱歉，AI 暂时无法连接。请检查网络或 API Key 设置。",
            error: true
        };
    }
};
