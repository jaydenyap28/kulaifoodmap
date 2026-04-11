import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, User, MapPin } from 'lucide-react';
import { getGeminiResponse } from '../services/chatService';

const buildMessageParts = (text, restaurants) => {
  const regex = /\[\[(\d+):([^\]]+)\]\]/g;
  const parts = [];
  const cards = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, idText, label] = match;

    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const restaurantId = Number(idText);
    const restaurant = restaurants.find((item) => item.id === restaurantId);

    if (restaurant) {
      if (!cards.find((card) => card.id === restaurant.id)) {
        cards.push(restaurant);
      }

      parts.push({ type: 'restaurant-link', id: restaurantId, label });
    } else {
      parts.push({ type: 'text', content: fullMatch });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return { parts, cards };
};

const getPlainMessageText = (message) => {
  if (typeof message.content === 'string') {
    return message.content;
  }

  return (message.parts || [])
    .map((part) => (part.type === 'restaurant-link' ? part.label : part.content || ''))
    .join('');
};

const AiFoodAssistant = ({ isOpen, onClose, restaurants, onRestaurantClick }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      parts: [
        {
          type: 'text',
          content: '你好！我是古来美食助手。告诉我你的需求，比如“想吃清淡一点的”或“推荐适合家庭聚餐的地方”。',
        },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
      alert('当前浏览器不支持语音识别功能。');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) {
      return;
    }

    const userText = inputValue.trim();
    setInputValue('');

    const nextMessages = [...messages, { id: Date.now(), type: 'user', content: userText }];
    setMessages(nextMessages);
    setIsTyping(true);

    const chatHistory = messages.slice(1).map((message) => ({
      role: message.type,
      content: getPlainMessageText(message),
    }));

    const result = await getGeminiResponse(userText, chatHistory);

    setIsTyping(false);

    if (result.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'bot',
          parts: [{ type: 'text', content: result.text }],
          isError: true,
        },
      ]);
      return;
    }

    const { parts, cards } = buildMessageParts(result.text, restaurants);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: 'bot',
        parts,
        cards,
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] w-full max-w-md h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700">
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.type === 'user' ? 'bg-gray-700' : 'bg-gradient-to-tr from-purple-500 to-blue-500'
                  }`}
                >
                  {msg.type === 'user' ? <User size={14} className="text-gray-300" /> : <Bot size={14} className="text-white" />}
                </div>

                <div className="flex flex-col gap-2">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-[#2a2a2a] text-gray-200 rounded-tl-sm border border-gray-700'
                    } ${msg.isError ? 'border-red-500/50 bg-red-900/20 text-red-200' : ''}`}
                  >
                    {msg.type === 'user' ? (
                      msg.content
                    ) : (
                      <>
                        {(msg.parts || []).map((part, index) =>
                          part.type === 'restaurant-link' ? (
                            <button
                              key={`${msg.id}-${part.id}-${index}`}
                              type="button"
                              onClick={() => {
                                const restaurant = restaurants.find((item) => item.id === part.id);
                                if (restaurant && onRestaurantClick) {
                                  onRestaurantClick(restaurant);
                                }
                              }}
                              className="text-blue-400 hover:underline font-medium"
                            >
                              {part.label}
                            </button>
                          ) : (
                            <React.Fragment key={`${msg.id}-text-${index}`}>{part.content}</React.Fragment>
                          ),
                        )}
                      </>
                    )}
                  </div>

                  {msg.cards && msg.cards.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {msg.cards.map((restaurant) => (
                        <div
                          key={restaurant.id}
                          onClick={() => onRestaurantClick && onRestaurantClick(restaurant)}
                          className="bg-[#1e1e1e] border border-gray-700 rounded-xl p-3 flex gap-3 hover:border-gray-500 transition-colors cursor-pointer group"
                        >
                          <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{restaurant.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <MapPin size={10} />
                              <span className="truncate">{restaurant.area || 'Kulai'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {restaurant.tags && restaurant.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                              {!restaurant.tags &&
                                restaurant.category &&
                                restaurant.category.slice(0, 2).map((category) => (
                                  <span key={category} className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-300 rounded-full">
                                    {category}
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

        <div className="p-4 bg-[#252525] border-t border-gray-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="问问 AI：今天想吃什么？或者让我推荐适合聚餐的地方。"
              className="flex-1 bg-[#1a1a1a] text-white text-sm px-4 py-3 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`px-3 py-3 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-[#1a1a1a] border-gray-700 text-gray-300 hover:text-white hover:border-gray-500'
              }`}
              title={isListening ? '停止语音输入' : '开始语音输入'}
            >
              <Bot size={18} />
            </button>
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
