import React from 'react';
import { AJLogo } from './AJLogo';

interface SpartanLogoProps {
  className?: string;
  theme?: 'professional' | 'futuristic';
  showText?: boolean;
  useImage?: boolean;
}

export const SpartanLogo: React.FC<SpartanLogoProps> = ({ 
  className = "w-8 h-8", 
  theme = 'professional',
  showText = false,
  useImage = false
}) => {
  return (
    <AJLogo 
      className={className} 
      theme={theme} 
      showText={showText} 
      useImage={useImage} 
    />
  );
};
