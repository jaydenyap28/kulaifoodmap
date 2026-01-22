import React from 'react';
import { Facebook } from 'lucide-react';

const Footer = ({ onAdminLogin }) => {
  return (
    <footer className="w-full bg-[#121212] text-gray-300 py-10 flex flex-col items-center justify-center gap-6 mt-12 relative z-20 border-t border-gray-800">
      {/* Main Title */}
      <h2 className="text-xl md:text-2xl font-bold text-center px-4 leading-relaxed text-white">
        欢迎推荐您喜爱的商家
      </h2>

      {/* Facebook Button */}
      <a 
        href="https://www.facebook.com/jnqjourney" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95"
      >
        <Facebook size={20} fill="currentColor" />
        <span>联系 Facebook 专页</span>
      </a>

      {/* Copyright */}
      <div className="mt-4 text-xs text-gray-500 text-center font-medium flex items-center gap-2">
        <span>© 2026 KulaiFood. Made by Jayden&Qing一起看世界</span>
        {onAdminLogin && (
            <button 
                onClick={onAdminLogin}
                className="opacity-10 hover:opacity-50 transition-opacity p-1"
                title="Admin Login"
            >
                🔒
            </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;
