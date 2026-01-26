import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, User, MapPin } from 'lucide-react';
import { checkOpenStatus } from '../utils/businessHours';

const KEYWORD_MAPPING = [
  // 身体不适 / 健康需求
  { keywords: ["痛", "病", "不舒服", "咳", "养生", "喉咙"], targetTags: ["清淡", "粥", "汤", "补身"] },
  { keywords: ["孕", "怀", "大肚子"], targetTags: ["孕妇友善", "健康", "有冷气"] },
  
  // 人群与环境
  { keywords: ["孩子", "小孩", "宝宝", "儿"], targetTags: ["适合小孩", "不辣", "有冷气"] },
  { keywords: ["老", "长辈", "牙"], targetTags: ["适合老人", "清淡", "软"] },
  { keywords: ["热", "晒", "凉快", "冷气"], targetTags: ["有冷气"] },
  
  // 价格与口味
  { keywords: ["穷", "没钱", "便宜", "抵", "经济"], targetTags: ["平价"] },
  { keywords: ["干", "捞"], targetTags: ["干", "干捞"] },
  { keywords: ["汤", "水"], targetTags: ["汤", "热"] },
  { keywords: ["素", "斋"], targetTags: ["素食", "健康"] },
  { keywords: ["肉骨茶", "bak kut teh", "bkt"], targetTags: ["肉骨茶", "汤"] },
  { keywords: ["擂茶", "lei cha"], targetTags: ["客家菜", "健康"] },
  { keywords: ["辣", "curry", "咖喱"], targetTags: ["重口味", "辣"] }
];

const AiFoodAssistant = ({ isOpen, onClose, restaurants }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      content: '你好！我是你的 AI 觅食助手。告诉我你的需求，比如“喉咙痛想吃点清淡的”或“带孩子去有冷气的地方”。' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: userText }]);
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const results = processQuery(userText);
      
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: results.length > 0 
          ? `为你找到了 ${results.length} 家符合“${userText}”的餐厅：` 
          : `抱歉，没有找到完全符合“${userText}”的推荐。试试换个说法？`,
        cards: results.slice(0, 5) // Limit to top 5
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const processQuery = (text) => {
    const targetTags = new Set();
    
    // Pre-process text: Remove common conversational fillers for better fallback matching
    // But keep them for keyword mapping as mappings might rely on them (though current ones don't)
    const cleanText = text.replace(/想吃|我要吃|去哪里吃|有没有|推荐|介绍|什么/g, '').trim();

    // 1. Keyword Matching (Use original text to capture nuances if any)
    KEYWORD_MAPPING.forEach(rule => {
      if (rule.keywords.some(k => text.toLowerCase().includes(k))) {
        rule.targetTags.forEach(t => targetTags.add(t));
      }
    });

    // 2. Filter Restaurants
    let filtered = restaurants.filter(r => {
      // If no tags inferred, fall back to name/category search using CLEANED text
      if (targetTags.size === 0) {
        if (!cleanText) return false; // Avoid matching empty string
        return (
            r.name.toLowerCase().includes(cleanText.toLowerCase()) || 
            (r.category && r.category.some(c => c.toLowerCase().includes(cleanText.toLowerCase()))) ||
            (r.tags && r.tags.some(t => t.toLowerCase().includes(cleanText.toLowerCase())))
        );
      }

      // Check intersection of restaurant tags with target tags
      // We look for ANY match currently
      const rTags = r.tags || [];
      const hasTagMatch = rTags.some(t => targetTags.has(t));
      
      // Also allow direct name match even if tags exist (using cleaned text)
      // e.g. User asks for "Spicy" (Tag) but specifically "Nasi Lemak" (Name)
      // This is a simple OR logic. For complex AND logic, we'd need more steps.
      // Here we assume if tag matches, it's good. If name matches cleanText, it's also good.
      const hasNameMatch = cleanText && r.name.toLowerCase().includes(cleanText.toLowerCase());

      return hasTagMatch || hasNameMatch;
    });

    // 3. Simple Ranking (Optional: prioritize those with MORE matching tags)
    if (targetTags.size > 0) {
        filtered.sort((a, b) => {
            const aTags = a.tags || [];
            const bTags = b.tags || [];
            const aCount = aTags.filter(t => targetTags.has(t)).length;
            const bCount = bTags.filter(t => targetTags.has(t)).length;
            return bCount - aCount;
        });
    }

    return filtered;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] w-full max-w-md h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#252525]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI 觅食助手</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.type === 'user' ? 'bg-gray-700' : 'bg-gradient-to-tr from-purple-500 to-blue-500'
                }`}>
                  {msg.type === 'user' ? <User size={14} className="text-gray-300" /> : <Bot size={14} className="text-white" />}
                </div>

                {/* Bubble */}
                <div className="flex flex-col gap-2">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.type === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-[#2a2a2a] text-gray-200 rounded-tl-sm border border-gray-700'
                    }`}>
                    {msg.content}
                    </div>

                    {/* Restaurant Cards */}
                    {msg.cards && (
                        <div className="flex flex-col gap-2 mt-1">
                            {msg.cards.map(r => (
                                <div key={r.id} className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-3 flex gap-3 hover:border-gray-500 transition-colors cursor-pointer group">
                                    <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium text-sm truncate">{r.name}</h4>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                            <MapPin size={10} />
                                            <span className="truncate">{r.area || 'Kulai'}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {r.tags && r.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded-full">
                                                    #{tag}
                                                </span>
                                            ))}
                                            {!r.tags && r.category && r.category.slice(0, 2).map(cat => (
                                                <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded-full">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
               <div className="flex gap-2 max-w-[85%]">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-white" />
                 </div>
                 <div className="bg-[#2a2a2a] px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#252525] border-t border-gray-700">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="试着输入：'今天喉咙痛想吃点清淡的' 或 '想找有冷气适合带小孩的地方'"
              className="flex-1 bg-[#1a1a1a] text-white text-sm px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AiFoodAssistant;
