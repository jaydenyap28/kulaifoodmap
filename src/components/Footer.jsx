import React from 'react';
import { Facebook, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = ({ onAdminLoginClick }) => {
  const { t } = useTranslation();

  return (
    <footer className="w-full max-w-[1600px] mx-auto px-4 pb-8 relative z-10 mt-12">
      <div className="bg-[#1e1e1e] rounded-3xl p-8 border border-[#333] flex flex-col items-center gap-6 text-center shadow-2xl">
        
        <div className="flex flex-col gap-2">
            <h3 className="text-white font-bold text-lg">{t('footer.recommend')}</h3>
            <a 
                href="https://www.facebook.com/kulaifoodmap" 
                target="_blank" 
                rel="noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
                <Facebook size={18} />
                {t('footer.contact_fb')}
            </a>
        </div>

        <div className="w-full h-px bg-[#333]"></div>

        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4 text-sm text-gray-500">
             <span>© 2026 Kulaifoodmap Made by JNQ Media</span>
             
             <button 
                onClick={onAdminLoginClick}
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
