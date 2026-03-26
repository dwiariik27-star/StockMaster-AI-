import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Eye, Palette } from 'lucide-react';

export function TabNavigation() {
  return (
    <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 bg-[#0a0a0a] border border-cyan-900/50 p-1 rounded-lg shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
      <TabsTrigger 
        value="research" 
        className="flex items-center gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-600 border border-transparent transition-all font-mono"
      >
        <TrendingUp className="w-4 h-4" /> Market Intel
      </TabsTrigger>
      <TabsTrigger 
        value="vision" 
        className="flex items-center gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-600 border border-transparent transition-all font-mono"
      >
        <Eye className="w-4 h-4" /> Vision Analyzer
      </TabsTrigger>
      <TabsTrigger 
        value="production" 
        className="flex items-center gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-600 border border-transparent transition-all font-mono"
      >
        <Palette className="w-4 h-4" /> Production
      </TabsTrigger>
    </TabsList>
  );
}
