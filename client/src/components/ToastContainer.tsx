import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';

const typeStyles: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-yellow-600 text-white',
};

const Icon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <span className='mr-3'>✅</span>;
    case 'error':
      return <span className='mr-3'>❌</span>;
    case 'warning':
      return <span className='mr-3'>⚠️</span>;
    default:
      return <span className='mr-3'>ℹ️</span>;
  }
};

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();
  const [leaving, setLeaving] = useState<Record<string, boolean>>({});

  const handleDismiss = useCallback(
    (id: string) => {
      setLeaving(prev => ({ ...prev, [id]: true }));
      window.setTimeout(() => dismissToast(id), 180); // allow exit animation
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers: number[] = [];
    toasts.forEach(t => {
      if (!leaving[t.id]) {
        const timer = window.setTimeout(
          () => handleDismiss(t.id),
          t.duration || 4000
        );
        timers.push(timer);
      }
    });
    return () => {
      timers.forEach(t => window.clearTimeout(t));
    };
  }, [toasts, leaving, handleDismiss]);

  return (
    <div className='fixed top-4 right-4 z-[9999] w-[92vw] max-w-sm'>
      <div className='space-y-3'>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`rounded-lg shadow-lg p-4 flex items-start transform transition-all duration-200 ease-out ${
              typeStyles[t.type] || typeStyles.info
            } ${leaving[t.id] ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
          >
            <Icon type={t.type} />
            <div className='flex-1'>
              {t.title && <div className='font-semibold mb-1'>{t.title}</div>}
              <div className='text-sm leading-snug'>{t.message}</div>
            </div>
            <button
              aria-label='Dismiss'
              onClick={() => handleDismiss(t.id)}
              className='ml-3 opacity-80 hover:opacity-100'
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
