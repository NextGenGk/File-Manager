import React from 'react';

export function Dialog({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) { 
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) onOpenChange?.(false); }}>
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }

export function DialogHeader({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) { return <h2 className={className}>{children}</h2>; }

export function DialogFooter({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }