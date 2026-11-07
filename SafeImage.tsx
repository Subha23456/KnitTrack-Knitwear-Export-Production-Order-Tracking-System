import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/fallback_garment.svg',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Normalize legacy and relative asset paths to clean public image paths
  const resolveSrc = (original?: string): string => {
    if (!original) return fallbackSrc;
    if (original.startsWith('data:image')) return original; // Base64 data URL
    if (original.includes('garment_navy_crew')) return '/images/garment_navy_crew.jpg';
    if (original.includes('garment_white_polo')) return '/images/garment_white_polo.jpg';
    if (original.includes('garment_kids_yellow')) return '/images/garment_kids_yellow.jpg';
    if (original.includes('knitwear_factory_floor')) return '/images/knitwear_factory_floor.jpg';
    return original;
  };

  const imageSrc = hasError ? fallbackSrc : resolveSrc(src);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-80'
        }`}
        {...rest}
      />
    </div>
  );
};
