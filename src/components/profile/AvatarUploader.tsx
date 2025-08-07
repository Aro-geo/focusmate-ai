import React, { useState } from 'react';
import { UserCircle, Upload } from 'lucide-react';

interface AvatarUploaderProps {
  currentUrl: string;
  onAvatarChange: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ 
  currentUrl, 
  onAvatarChange, 
  size = 'md',
  editable = false 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to your server or cloud storage
      // For now, we'll just create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      onAvatarChange(localUrl);
    }
  };

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${editable ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => editable && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {currentUrl ? (
        <img
          src={currentUrl}
          alt="User avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={`bg-indigo-100 flex items-center justify-center ${sizeClasses[size]}`}>
          <UserCircle
            className="text-indigo-600"
            size={size === 'sm' ? 36 : size === 'md' ? 72 : 96}
          />
        </div>
      )}

      {editable && isHovering && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Upload className="text-white" size={24} />
        </div>
      )}

      {editable && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          title="Upload avatar"
        />
      )}
    </div>
  );
};

export default AvatarUploader;
