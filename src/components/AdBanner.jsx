import React, { useState, useEffect } from 'react';
import { Upload, X, Edit, Save, Trash, PlayCircle, Image as ImageIcon, Link as LinkIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';

const AdBanner = ({ data = [], onUpdate, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // Which ad is being edited, null for new
  const [currentIndex, setCurrentIndex] = useState(0); // For Carousel

  // Initialize edit form state
  const [editForm, setEditForm] = useState({
    mediaUrl: '',
    linkUrl: '',
    mediaType: 'image', // 'image', 'video', 'link_card'
    title: '', // For link_card
    description: '', // For link_card
    thumbnail: '' // For link_card
  });

  // Auto-scroll logic
  useEffect(() => {
    if (!data || data.length <= 1 || isEditing) return;
    
    const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 5000); // 5 seconds auto-rotate

    return () => clearInterval(interval);
  }, [data, isEditing]);

  // Reset index if data changes significantly
  useEffect(() => {
      if (currentIndex >= data.length && data.length > 0) {
          setCurrentIndex(0);
      }
  }, [data, currentIndex]);

  const handleEditClick = (index = null) => {
    if (index !== null) {
        setEditingIndex(index);
        setEditForm(data[index]);
    } else {
        setEditingIndex(null); // New Item
        setEditForm({ mediaUrl: '', linkUrl: '', mediaType: 'image', title: '', description: '', thumbnail: '' });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    let newData = [...data];
    if (editingIndex !== null) {
        // Update existing
        newData[editingIndex] = editForm;
    } else {
        // Add new
        newData.push(editForm);
    }
    onUpdate(newData);
    setIsEditing(false);
  };

  const handleDelete = (index) => {
      if (window.confirm('确定要删除这个广告吗？(Are you sure?)')) {
          const newData = data.filter((_, i) => i !== index);
          onUpdate(newData);
          if (editingIndex === index) setIsEditing(false);
      }
  };

  const handleImageUpload = async (e, field = 'mediaUrl') => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        if (!window.confirm("使用本地上传会将图片转换为 Base64 文本。\n\n建议: 仅上传小图片或使用网络链接。\n\n是否继续?")) {
            e.target.value = '';
            return;
        }

        const base64 = await compressImage(file, 800, 0.7); 
        setEditForm(prev => ({ ...prev, [field]: base64 }));
    } catch (err) {
        console.error("Image processing failed", err);
        alert("图片处理失败");
    }
  };

  // --- Render Editor ---
  if (isEditing) {
    return (
      <div className="w-full max-w-md mx-auto mt-6 mb-4 bg-[#1e1e1e] border border-gray-700 p-4 rounded-xl shadow-lg relative z-20">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold text-sm">
                {editingIndex !== null ? '编辑广告 (Edit)' : '添加新广告 (Add New)'}
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
            </button>
        </div>

        <div className="space-y-4">
            {/* Media Type Selection */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <label className={`flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${editForm.mediaType === 'image' ? 'bg-white text-black border-white' : 'bg-[#333] text-gray-300 border-gray-600'}`}>
                    <input type="radio" name="mediaType" checked={editForm.mediaType === 'image'} onChange={() => setEditForm({...editForm, mediaType: 'image'})} className="hidden" />
                    <ImageIcon size={14}/> <span className="text-xs font-bold">图片 (Image)</span>
                </label>
                <label className={`flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${editForm.mediaType === 'video' ? 'bg-white text-black border-white' : 'bg-[#333] text-gray-300 border-gray-600'}`}>
                    <input type="radio" name="mediaType" checked={editForm.mediaType === 'video'} onChange={() => setEditForm({...editForm, mediaType: 'video'})} className="hidden" />
                    <PlayCircle size={14}/> <span className="text-xs font-bold">影片 (Video)</span>
                </label>
                <label className={`flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${editForm.mediaType === 'link_card' ? 'bg-white text-black border-white' : 'bg-[#333] text-gray-300 border-gray-600'}`}>
                    <input type="radio" name="mediaType" checked={editForm.mediaType === 'link_card'} onChange={() => setEditForm({...editForm, mediaType: 'link_card'})} className="hidden" />
                    <LinkIcon size={14}/> <span className="text-xs font-bold">链接卡片 (Link Card)</span>
                </label>
            </div>

            {/* Inputs based on Type */}
            {editForm.mediaType === 'link_card' ? (
                // --- Link Card Inputs ---
                <div className="space-y-3">
                     <div>
                        <label className="text-xs text-gray-500 mb-1 block">标题 (Title)</label>
                        <input 
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full bg-[#2d2d2d] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                            placeholder="e.g. 关注我的小红书"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">描述 (Description)</label>
                        <input 
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full bg-[#2d2d2d] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                            placeholder="e.g. 分享古来美食探店..."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">封面图 (Thumbnail)</label>
                         <div className="flex gap-2 items-center">
                            <input 
                                value={editForm.thumbnail}
                                onChange={(e) => setEditForm({...editForm, thumbnail: e.target.value})}
                                className="flex-1 bg-[#2d2d2d] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                                placeholder="https://..."
                            />
                             <label className="cursor-pointer bg-[#333] p-1.5 rounded border border-gray-600 hover:bg-[#444] transition">
                                <Upload size={14} className="text-gray-300" />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'thumbnail')} />
                             </label>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">跳转链接 (Target Link)</label>
                        <input 
                            value={editForm.linkUrl}
                            onChange={(e) => setEditForm({...editForm, linkUrl: e.target.value})}
                            className="w-full bg-[#2d2d2d] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            ) : (
                // --- Image/Video Inputs ---
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                            {editForm.mediaType === 'image' ? '图片链接 (Image URL)' : '影片链接 (Video URL)'}
                        </label>
                        <input 
                            value={editForm.mediaUrl}
                            onChange={(e) => setEditForm({...editForm, mediaUrl: e.target.value})}
                            className="w-full bg-[#2d2d2d] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                            placeholder="https://..."
                        />
                    </div>
                     {/* Local Upload (Image Only) */}
                    {editForm.mediaType === 'image' && (
                        <div>
                            <label className="cursor-pointer inline-flex items-center gap-2 bg-[#333] px-3 py-1.5 rounded text-xs text-gray-300 hover:bg-[#444] transition border border-gray-600 w-full justify-center">
                                <Upload size={14} />
                                <span>本地上传图片 (Local Upload)</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">跳转链接 (Target Link)</label>
                        <input 
                            value={editForm.linkUrl}
                            onChange={(e) => setEditForm({...editForm, linkUrl: e.target.value})}
                            className="w-full bg-[#2d2d2d] border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:border-white outline-none"
                            placeholder="https://..."
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-2 pt-2">
                {editingIndex !== null && (
                    <button 
                        onClick={() => handleDelete(editingIndex)}
                        className="flex-1 bg-red-900/50 text-red-200 border border-red-800 font-bold py-2 rounded-lg hover:bg-red-900 transition flex items-center justify-center gap-2"
                    >
                        <Trash size={16} />
                        删除
                    </button>
                )}
                <button 
                    onClick={handleSave}
                    className="flex-[2] bg-white text-black font-bold py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    保存 (Save)
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- Display Render ---
  const AdItem = ({ item, index }) => {
      const Wrapper = ({ children }) => (
          <div className="relative group w-full h-full">
               <a 
                  href={item.linkUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`block w-full h-full overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-black/60 transition-all duration-500 ${item.linkUrl ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={e => !item.linkUrl && e.preventDefault()}
               >
                   {children}
               </a>
               
               {isAdmin && (
                  <button 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditClick(index);
                    }}
                    className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition hover:bg-black z-20 backdrop-blur-sm"
                    title="编辑此广告 (Edit)"
                  >
                      <Edit size={16} />
                  </button>
              )}
          </div>
      );

      if (item.mediaType === 'link_card') {
          return (
              <Wrapper>
                  <div className="bg-[#1e1e1e] h-full w-full flex flex-row">
                      {/* Image Side (Left) - 40% */}
                      {item.thumbnail && (
                  <div className="w-[70%] h-full relative overflow-hidden">
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1e1e1e]/90"></div>
                  </div>
                )}
                {/* Content Side (Right) - 30% */}
                <div className={`flex-1 flex flex-col justify-center p-4 md:p-6 bg-[#1e1e1e] ${!item.thumbnail ? 'w-full' : ''}`}>
                  <h4 className="text-white font-black text-xl md:text-3xl leading-tight mb-2 drop-shadow-md">{item.title || '无标题'}</h4>
                  <p className="text-gray-400 text-sm md:text-base line-clamp-4 leading-relaxed">{item.description || '点击查看详情'}</p>
                  
                  <div className="mt-3 flex items-center text-xs text-gray-500 font-medium">
                    点击跳转 <ChevronRight size={12} className="ml-0.5" />
                  </div>
                </div>
                  </div>
              </Wrapper>
          );
      }

      if (item.mediaType === 'video') {
          return (
              <Wrapper>
                  <div className="w-full h-full bg-black flex items-center justify-center relative">
                       {item.mediaUrl.includes('youtube') || item.mediaUrl.includes('youtu.be') ? (
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src={item.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + "?autoplay=1&mute=1&loop=1&playlist=" + item.mediaUrl.split('v=')[1]} 
                            title="Ad Video"
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="pointer-events-none w-full h-full object-cover" 
                          ></iframe>
                      ) : (
                          <video 
                            src={item.mediaUrl} 
                            muted 
                            loop 
                            autoPlay 
                            playsInline
                            className="w-full h-full object-cover"
                          />
                      )}
                  </div>
              </Wrapper>
          );
      }

      // Default Image
      return (
          <Wrapper>
              <img 
                  src={item.mediaUrl} 
                  alt="Ad" 
                  className="w-full h-full object-cover"
              />
          </Wrapper>
      );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 mb-8 relative group/container">
        {/* Main Display Area */}
        <div className="relative w-full aspect-[2.5/1] md:aspect-[3.5/1] bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            {data && data.length > 0 ? (
                // Show Current Ad
                <div className="w-full h-full">
                    <AdItem item={data[currentIndex]} index={currentIndex} />
                </div>
            ) : (
                // Empty State Placeholder
                 <div className="w-full h-full flex items-center justify-center bg-gray-900/50">
                    <div 
                        onClick={() => isAdmin && handleEditClick(null)}
                        className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 transition cursor-pointer p-10 border-2 border-dashed border-gray-700 rounded-xl hover:border-gray-500"
                    >
                        <Plus size={48} className="mb-2 opacity-50" />
                        <span className="text-lg font-bold">暂无广告 (No Ads)</span>
                        <span className="text-sm mt-1">点击此处添加第一个广告位</span>
                    </div>
                 </div>
            )}

            {/* Navigation Arrows (Only if > 1) */}
            {data && data.length > 1 && (
                <>
                    <button 
                        onClick={(e) => { e.preventDefault(); setCurrentIndex((prev) => (prev - 1 + data.length) % data.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition opacity-0 group-hover/container:opacity-100"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={(e) => { e.preventDefault(); setCurrentIndex((prev) => (prev + 1) % data.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition opacity-0 group-hover/container:opacity-100"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            {/* Indicators (Only if > 1) */}
            {data && data.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {data.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/80'}`}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Global Add Button (Floating outside top-right) */}
        {isAdmin && (
            <div className="absolute -top-10 right-4 flex gap-2">
                 {data.length > 0 && (
                    <span className="text-xs text-gray-500 self-end mb-1 mr-2">
                        {currentIndex + 1} / {data.length}
                    </span>
                 )}
                <button 
                    onClick={() => handleEditClick(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#333] hover:bg-white hover:text-black text-gray-300 text-xs rounded-full transition-colors shadow-lg border border-gray-700 font-bold"
                >
                    <Plus size={14} /> 添加广告 (Add Ad)
                </button>
            </div>
        )}
    </div>
  );
};

export default AdBanner;
