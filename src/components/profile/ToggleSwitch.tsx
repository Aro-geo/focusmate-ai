import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label, disabled = false }) => {
  return (
    <div className="flex items-center justify-between">
      {label && (
        <label htmlFor={id} className="text-gray-700 mr-2">
          {label}
        </label>
      )}
      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
        <input
          type="checkbox"
          id={id}
          aria-label={label || `Toggle ${id}`}
          className="absolute w-6 h-6 opacity-0 cursor-pointer z-10"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <label
          htmlFor={id}
          className={`block h-6 overflow-hidden rounded-full cursor-pointer ${
            disabled ? 'bg-gray-200' : checked ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`block h-6 w-6 rounded-full bg-white transform transition-transform duration-200 ${
              checked ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </label>
      </div>
    </div>
  );
};

export default ToggleSwitch;
