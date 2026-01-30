import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

const ImageWithFallback = ({ src, alt, className }) => {
  const [error, setError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  if (error || !src) {
    return (
      <div className={`${className} bg-gray-200 flex flex-col items-center justify-center text-gray-400`}>
        <span className="text-4xl font-bold opacity-30">
          {alt ? alt.charAt(0).toUpperCase() : '?'}
        </span>
        <ImageOff size={24} className="mt-2 opacity-20" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};

export default ImageWithFallback;
