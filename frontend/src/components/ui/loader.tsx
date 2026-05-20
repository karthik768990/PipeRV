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

import { Skeleton } from './skeleton';

export function ModuleLoader({ name }: { name: string }) {
  return (
    <div className="flex flex-col w-full h-full min-h-[300px] p-6 bg-card/10 rounded-xl border border-border/20 shadow-sm relative overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg bg-primary/10" />
          <Skeleton className="h-6 w-32 bg-muted/40" />
        </div>
        <Skeleton className="h-5 w-20 bg-muted/30 rounded-full" />
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-4 flex-1">
        <Skeleton className="w-full h-12 bg-muted/20 rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-32 bg-muted/20 rounded-lg" />
          <Skeleton className="col-span-1 h-32 bg-muted/20 rounded-lg" />
        </div>
        <Skeleton className="w-3/4 h-8 bg-muted/20 rounded-lg" />
      </div>

      {/* Pulsing overlay text */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/5 backdrop-blur-[1px]">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 border border-border/50 shadow-lg backdrop-blur-md">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Initializing {name}</span>
        </div>
      </div>
    </div>
  );
}
