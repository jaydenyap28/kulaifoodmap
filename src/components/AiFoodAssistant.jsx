import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, User, MapPin, Mic, MicOff } from 'lucide-react';
import { getGeminiResponse } from '../services/chatService';

const AiFoodAssistant = ({ isOpen, onClose, restaurants, onRestaurantClick }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      content: '你好！我是古来美食专家。告诉我你的需求，比如“喉咙痛想吃点清淡的”或“带孩子去有冷气的地方”。' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'zh-CN';

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => {
                const newValue = prev ? `${prev} ${transcript}` : transcript;
                return newValue;
            });
            setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert('您的浏览器不支持语音识别功能');
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const parseResponse = (text) => {
    // Extract restaurant IDs from format [[ID:Name]]
    const regex = /\[\[(\d+):([^\]]+)\]\]/g;
    let match;
    const cards = [];
    const cleanText = text.replace(regex, (match, id, name) => {
        const restaurant = restaurants.find(r => r.id === parseInt(id));
        if (restaurant) {
            if (!cards.find(c => c.id === restaurant.id)) {
                cards.push(restaurant);
            }
            // Make clickable link
            return `<button class="text-blue-400 hover:underline font-medium" data-restaurant-id="${id}">${name}</button>`;
        }
        return name;
    });

    return { cleanText, cards };
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const newMessages = [...messages, { id: Date.now(), type: 'user', content: userText }];
    setMessages(newMessages);
    setIsTyping(true);

    // Call Gemini API
    const chatHistory = messages.slice(1).map(msg => ({
        role: msg.type,
        content: msg.content // Note: We are sending raw content, ideally should send plain text without HTML
    }));

    const result = await getGeminiResponse(userText, chatHistory);
    
    setIsTyping(false);

    if (result.error) {
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            type: 'bot',
            content: result.text,
            isError: true
        }]);
    } else {
        const { cleanText, cards } = parseResponse(result.text);
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            type: 'bot',
            content: cleanText,
            cards: cards
        }]);
    }
  };

  const handleContentClick = (e) => {
    const btn = e.target.closest('button[data-restaurant-id]');
    if (btn) {
        const id = parseInt(btn.dataset.restaurantId);
        const restaurant = restaurants.find(r => r.id === id);
        if (restaurant && onRestaurantClick) {
            onRestaurantClick(restaurant);
        }
    }
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
              <h3 className="font-bold text-white text-sm">古来美食智能助手</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                Powered by Gemini
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
                    <div 
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.type === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : 'bg-[#2a2a2a] text-gray-200 rounded-tl-sm border border-gray-700'
                        } ${msg.isError ? 'border-red-500/50 bg-red-900/20 text-red-200' : ''}`}
                        onClick={msg.type === 'bot' ? handleContentClick : undefined}
                        dangerouslySetInnerHTML={msg.type === 'bot' ? { __html: msg.content } : undefined}
                    >
                        {msg.type === 'user' ? msg.content : undefined}
                    </div>

                    {/* Restaurant Cards */}
                    {msg.cards && (
                        <div className="flex flex-col gap-2 mt-1">
                            {msg.cards.map(r => (
                                <div 
                                    key={r.id} 
                                    onClick={() => onRestaurantClick && onRestaurantClick(r)}
                                    className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-3 flex gap-3 hover:border-gray-500 transition-colors cursor-pointer group"
                                >
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
                 <span className="text-xs text-gray-500 self-center">AI 正在思考...</span>
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
            <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-colors ${
                    isListening 
                        ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="问问 AI：'今天喉咙痛吃什么？' 或 '推荐个适合聚餐的地方'"
              className="flex-1 bg-[#1a1a1a] text-white text-sm px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
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
