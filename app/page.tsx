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
    <div className="min-h-screen bg-[#050505] p-4 md:p-8 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#050505] to-[#050505]">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyan-500/20 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              <Sparkles className="w-8 h-8 text-fuchsia-500" />
              StockMaster AI <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 px-2 py-1 rounded-full ml-2 align-middle font-mono">v5 Multimodal</span>
            </h1>
            <p className="text-cyan-500/70 mt-1 font-mono text-sm">Platform Intelijen Pasar & Produksi Masal Adobe Stock</p>
          </div>
          <Button variant={apiKey ? "outline" : "default"} className={!apiKey ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"} onClick={() => setShowSettings(!showSettings)}>
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
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8 bg-slate-900/50 border border-cyan-500/20 p-1 rounded-lg">
            <TabsTrigger value="research" className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)]"><TrendingUp className="w-4 h-4" /> Market Intel</TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)]"><Eye className="w-4 h-4" /> Vision Analyzer</TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_10px_rgba(6,182,212,0.2)]"><Palette className="w-4 h-4" /> Production</TabsTrigger>
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
