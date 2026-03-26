'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Key } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  onSettingsClick: () => void;
}

export function Header({ hasApiKey, onSettingsClick }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-900/50 pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cyan-300 flex items-center gap-2 font-mono">
          <Sparkles className="w-7 h-7 text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
          StockMaster AI <span className="text-[10px] uppercase tracking-widest bg-cyan-950/50 text-cyan-400 border border-cyan-500/50 px-2 py-1 rounded-full ml-2 align-middle font-medium shadow-[0_0_10px_rgba(6,182,212,0.2)]">v5 Multimodal</span>
        </h1>
        <p className="text-cyan-500/70 mt-1.5 text-sm font-medium tracking-wide font-mono">Platform Intelijen Pasar & Produksi Masal Adobe Stock</p>
      </div>
      <Button 
        variant={hasApiKey ? "outline" : "default"} 
        className={!hasApiKey 
          ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold font-mono" 
          : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-300 font-mono"
        } 
        onClick={onSettingsClick}
      >
        <Key className="w-4 h-4 mr-2" /> {hasApiKey ? 'API Key Terpasang' : 'Set API Key (BYOK)'}
      </Button>
    </header>
  );
}
