"use client";
import { useToast, dismiss } from "@/hooks/use-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
              t.variant === 'destructive' ? 'bg-red-500/15 border-red-500/30 text-red-500 shadow-red-500/10' :
              t.variant === 'success' ? 'bg-green-500/15 border-green-500/30 text-green-500 shadow-green-500/10' :
              'bg-card/80 border-border/60 text-foreground shadow-black/10'
            }`}
          >
            {t.variant === 'destructive' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> :
             t.variant === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> :
             <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-500" />}
            
            <div className="grid gap-1 flex-1">
              {t.title && <div className="text-sm font-bold tracking-tight">{t.title}</div>}
              {t.description && <div className="text-sm opacity-80 leading-relaxed">{t.description}</div>}
            </div>
            
            <button 
              onClick={() => dismiss(t.id)} 
              className="shrink-0 p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-black/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
