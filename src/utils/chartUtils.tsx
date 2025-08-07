import React from 'react';

// Bar chart component with dynamic height
export const DynamicHeightBar: React.FC<{
  percentage: number;
  className?: string;
}> = ({ percentage, className = '' }) => {
  // Convert percentage to a CSS height
  const heightClass = `h-[${Math.max(percentage, 1)}%]`;
  
  return (
    <div 
      className={`${heightClass} ${className}`}
      aria-label={`${percentage}%`}
    ></div>
  );
};

// Progress bar with dynamic width
export const DynamicWidthBar: React.FC<{
  percentage: number;
  className?: string;
}> = ({ percentage, className = '' }) => {
  // Convert percentage to a CSS width
  const widthClass = `w-[${Math.max(percentage, 1)}%]`;
  
  return (
    <div 
      className={`${widthClass} ${className}`}
      aria-label={`${percentage}%`}
    ></div>
  );
};
