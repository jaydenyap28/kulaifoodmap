import React from 'react';
import { Facebook, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MAIN_VIDEO_LINK } from '../data/restaurants';

const Footer = ({ onAdminLogin }) => {
  const { t } = useTranslation();

  return (
    <footer className="w-full max-w-[1600px] mx-auto px-4 pb-8 relative z-10 mt-12">
      <div className="bg-[#1e1e1e] rounded-3xl p-8 border border-[#333] flex flex-col items-center gap-6 text-center shadow-2xl">
        
        <div className="flex flex-col gap-4 items-center">
            <h3 className="text-white font-bold text-lg">{t('footer.recommend')}</h3>
            <a 
                href={MAIN_VIDEO_LINK}
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-bold shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
                <Facebook size={20} className="group-hover:rotate-12 transition-transform" />
                📺 去视频留言 (推荐商家/纠错)
            </a>
        </div>

        <div className="w-full h-px bg-[#333]"></div>

        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-sm text-gray-500">
             <span>© 2026 Kulaifoodmap Made by JNQ Media</span>
             
             <button 
                onClick={onAdminLogin}
                className="flex items-center gap-1.5 hover:text-gray-300 transition-colors"
             >
                <Lock size={14} />
                {t('footer.admin_login')}
             </button>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
