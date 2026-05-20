import { useState, useEffect } from 'react';

type ToastProps = { 
  id: string; 
  title?: string; 
  description?: string; 
  variant?: 'default' | 'destructive' | 'success'; 
};

let memoryState: ToastProps[] = [];
let listeners: Function[] = [];

export function toast({ title, description, variant = 'default' }: Omit<ToastProps, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9);
  const newToast = { id, title, description, variant };
  memoryState = [newToast, ...memoryState];
  listeners.forEach(l => l(memoryState));
  setTimeout(() => dismiss(id), 5000);
}

export function dismiss(id: string) {
  memoryState = memoryState.filter(t => t.id !== id);
  listeners.forEach(l => l(memoryState));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>(memoryState);
  useEffect(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter(l => l !== setToasts); };
  }, []);
  return { toasts, toast, dismiss };
}
