'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Eye, Palette, Key } from 'lucide-react';
import { toast } from 'sonner';

import { useGemini } from '@/hooks/useGemini';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ResearchTab } from '@/components/research/ResearchTab';
import { VisionTab } from '@/components/vision/VisionTab';
import { ProductionTab } from '@/components/production/ProductionTab';
import { GeneratedPrompt } from '@/types';

export default function StockMasterDashboard() {
  const [activeTab, setActiveTab] = useState('research');
  const [showSettings, setShowSettings] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);

  const {
    apiKey,
    saveApiKey,
    clearApiKey,
    selectedModel,
    saveModel,
    getAIClient,
    isMounted,
  } = useGemini();

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  const handleSendToProduction = (nicheName: string) => {
    setKeyword(nicheName); 
    setActiveTab('production');
    toast.success(`Niche "${nicheName}" dikirim ke Production Engine!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendVisionToProduction = (prompt: GeneratedPrompt) => {
    setGeneratedPrompts([prompt]);
    setActiveTab('production');
    toast.success('Prompt hasil Reverse-Engineering dikirim ke Production!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-50 p-4 md:p-8 font-sans selection:bg-fuchsia-500/40">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-900/50 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-300 flex items-center gap-2 font-mono">
              <Sparkles className="w-7 h-7 text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
              StockMaster AI <span className="text-[10px] uppercase tracking-widest bg-cyan-950/50 text-cyan-400 border border-cyan-500/50 px-2 py-1 rounded-full ml-2 align-middle font-medium shadow-[0_0_10px_rgba(6,182,212,0.2)]">v5 Multimodal</span>
            </h1>
            <p className="text-cyan-500/70 mt-1.5 text-sm font-medium tracking-wide font-mono">Platform Intelijen Pasar & Produksi Masal Adobe Stock</p>
          </div>
          <Button variant={apiKey ? "outline" : "default"} className={!apiKey ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold font-mono" : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-300 font-mono"} onClick={() => setShowSettings(!showSettings)}>
            <Key className="w-4 h-4 mr-2" /> {apiKey ? 'API Key Terpasang' : 'Set API Key (BYOK)'}
          </Button>
        </header>

        {showSettings && (
          <SettingsPanel
            apiKey={apiKey}
            saveApiKey={saveApiKey}
            clearApiKey={clearApiKey}
            selectedModel={selectedModel}
            saveModel={saveModel}
            onClose={() => setShowSettings(false)}
            getAIClient={getAIClient}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 bg-[#0a0a0a] border border-cyan-900/50 p-1 rounded-lg shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
            <TabsTrigger value="research" className="flex items-center gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-600 border border-transparent transition-all font-mono"><TrendingUp className="w-4 h-4" /> Market Intel</TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-600 border border-transparent transition-all font-mono"><Eye className="w-4 h-4" /> Vision Analyzer</TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300 data-[state=active]:border-cyan-500/50 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-600 border border-transparent transition-all font-mono"><Palette className="w-4 h-4" /> Production</TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-6 w-full">
            <ResearchTab 
              getAIClient={getAIClient} 
              onSendToProduction={handleSendToProduction} 
            />
          </TabsContent>

          <TabsContent value="vision" className="space-y-6 w-full">
            <VisionTab 
              getAIClient={getAIClient} 
              onSendToProduction={handleSendVisionToProduction} 
            />
          </TabsContent>

          <TabsContent value="production" className="space-y-6 w-full">
            <ProductionTab 
              getAIClient={getAIClient} 
              selectedModel={selectedModel}
              keyword={keyword}
              setKeyword={setKeyword}
              generatedPrompts={generatedPrompts}
              setGeneratedPrompts={setGeneratedPrompts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
