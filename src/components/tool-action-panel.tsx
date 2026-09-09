import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

type ToolActionButtonProps = React.ComponentProps<typeof Button> & {
  tone?: 'neutral' | 'accent' | 'danger';
};

export function ToolActionPanel({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-none border border-[#1a1a1a] bg-[#050505] p-2', className)}>
      {label && <span className="mr-1 text-[10px] uppercase tracking-widest text-zinc-400">{label}</span>}
      {children}
    </div>
  );
}

export function ToolActionButton({ tone = 'neutral', className, ...props }: ToolActionButtonProps) {
  return (
    <Button
      {...props}
      size={props.size || 'sm'}
      className={cn(
        'h-8 rounded-none font-bold',
        tone === 'accent' && 'border-[#00ff9c]/40 bg-[#00ff9c]/10 text-[#00ff9c] hover:border-[#00ff9c] hover:bg-[#00ff9c]/20',
        tone === 'danger' && 'border-red-500/40 bg-black! text-red-300 hover:border-red-400 hover:bg-red-500/10!',
        tone === 'neutral' && 'border-[#1a1a1a] bg-black text-zinc-300 hover:border-[#00ff9c] hover:text-[#00ff9c]',
        className
      )}
    />
  );
}
