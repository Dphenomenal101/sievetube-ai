import { cn } from "@/lib/utils";

export function TypingAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="h-2 w-2 rounded-full bg-slate-400 animate-[bounce_0.7s_infinite]" />
      <div className="h-2 w-2 rounded-full bg-slate-400 animate-[bounce_0.7s_0.2s_infinite]" />
      <div className="h-2 w-2 rounded-full bg-slate-400 animate-[bounce_0.7s_0.4s_infinite]" />
    </div>
  );
} 