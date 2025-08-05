import React from 'react';

export function DropdownMenu({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) { return <button>{children}</button>; }

export function DropdownMenuContent({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }

export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) { return <div onClick={onClick} className="cursor-pointer p-2 hover:bg-gray-100">{children}</div>; }
