"use client";
import { useState, useEffect, useCallback } from 'react';

interface Toast { id: number; message: string; type: 'error' | 'success' | 'info'; }

let toastId = 0;
let addToastFn: ((msg: string, type?: string) => void) | null = null;

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'error') {
  if (addToastFn) addToastFn(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: string = 'error') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type: type as any }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => { addToastFn = addToast; }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={"px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in " + (
          t.type === 'error' ? 'bg-red-500 text-white' :
          t.type === 'success' ? 'bg-emerald-500 text-white' :
          'bg-blue-500 text-white'
        )}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
