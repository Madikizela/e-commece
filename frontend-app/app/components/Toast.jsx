import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className="fixed top-4 left-4 right-4 md:top-4 md:right-4 md:left-auto z-50 animate-fade-in">
      <div className={`${types[type]} text-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-2xl flex items-center space-x-3 w-full md:min-w-[300px] md:w-auto`}>
        <span className="text-lg md:text-2xl flex-shrink-0">{icons[type]}</span>
        <span className="font-semibold text-sm md:text-base flex-1">{message}</span>
        <button 
          onClick={onClose} 
          className="ml-auto text-white hover:text-gray-200 p-1 flex-shrink-0 active:scale-95"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
