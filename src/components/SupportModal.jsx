import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Coffee, Heart, Upload } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

const SupportModal = ({ isOpen, onClose, isAdmin, supportQR, onUpdateQR }) => {
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        if (!window.confirm("确定上传新的 QR Code 吗？(Update QR?)")) {
             e.target.value = ''; // Reset input
             return;
        }
        
        const base64 = await compressImage(file);
        onUpdateQR(base64);
        alert("QR Code 已更新！(Updated)");
        setImgError(false); // Reset error state on new upload
    } catch (err) {
        console.error("Failed to upload QR", err);
        alert("上传失败: " + err.message);
    } finally {
        e.target.value = ''; // Always reset
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#FFFDF0] rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header Pattern / Decoration */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-[#3E2723] opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3E2723 1px, transparent 0)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full text-[#3E2723] transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="relative p-8 pt-10 text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-[#3E2723] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#3E2723]/20">
                <Coffee size={32} className="text-[#FFFDF0]" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-[#3E2723] mb-2 leading-tight">
                觉得好用？<br/>请我喝杯 Kopi 吧！☕️
              </h2>

              {/* Description */}
              <p className="text-[#5D4037] text-sm leading-relaxed mb-8 px-2">
                这个网站是由我一人独立开发和维护的。如果您发现了宝藏美食，或者觉得这个工具帮到了您，欢迎随意打赏，支持服务器运作！
              </p>

              {/* Donation Options */}
              <div className="space-y-4">
                {/* Method A: TNG QR */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#3E2723]/10 relative group">
                  <div className={`aspect-auto w-full max-w-sm mx-auto rounded-xl mb-3 overflow-hidden flex items-center justify-center relative ${imgError ? 'bg-gray-200' : 'bg-gray-100'}`}>
                    {/* QR Code Image */}
                    {!imgError ? (
                        <img 
                            src={supportQR || "https://i.ibb.co/LXb1FHhH/JNQ-MEDIA-TNG.jpg"} 
                            alt="Touch 'n Go QR Code" 
                            className="w-full h-auto object-contain max-h-[400px]"
                            onError={(e) => {
                                setImgError(true);
                            }}
                        />
                    ) : (
                        <div className="text-[#3E2723]/40 text-xs text-center p-4">
                            QR Code Image Not Found<br/>(Put /tng-qr.jpg in public folder)
                        </div>
                    )}
                    
                    {/* Admin Upload Overlay - Always render if admin, regardless of image error */}
                    {isAdmin && (
                        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity cursor-pointer z-20 ${imgError ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                             onClick={(e) => {
                                 e.stopPropagation();
                                 fileInputRef.current?.click();
                             }}>
                            <div className="text-white flex flex-col items-center gap-2">
                                <Upload size={24} />
                                <span className="text-xs font-bold">更换 QR (Admin)</span>
                            </div>
                        </div>
                    )}
                  </div>
                  
                  <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                  />

                  <p className="font-bold text-[#3E2723] text-sm flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Touch 'n Go eWallet
                  </p>
                </div>

                {/* Divider */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#3E2723]/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#FFFDF0] px-2 text-[#3E2723]/40 font-medium">Or</span>
                    </div>
                </div>

                {/* Method B: Buy Me a Coffee Link */}
                <a
                  href="https://www.buymeacoffee.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-3.5 bg-[#FFDD00] hover:bg-[#FFEA00] text-[#3E2723] rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-yellow-400/20"
                >
                  <Coffee size={18} className="mr-2" />
                  Buy Me a Coffee
                  <ExternalLink size={14} className="ml-1 opacity-60" />
                </a>
              </div>

              {/* Footer Note */}
              <div className="mt-8 flex items-center justify-center gap-1 text-xs text-[#3E2723]/40 font-medium">
                Made with <Heart size={10} className="fill-red-400 text-red-400" /> in Kulai
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SupportModal;
