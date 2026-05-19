import React from 'react';

export function GlobalLoader({ message = "Loading PipeRV Simulator..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm transition-all duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 border-4 border-transparent border-t-sky-500 border-r-sky-500 rounded-full animate-spin" />
          <div className="absolute w-16 h-16 border-4 border-transparent border-b-green-500 border-l-green-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse shadow-[0_0_20px_rgba(14,165,233,0.5)]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-green-400">
            {message}
          </h2>
          <div className="flex gap-1 items-center h-4">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModuleLoader({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px] p-6 bg-card/10 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground animate-pulse">Loading {name}...</span>
      </div>
    </div>
  );
}
