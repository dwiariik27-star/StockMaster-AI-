'use client';

import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

import { useAI } from '@/hooks/useAI';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ResearchTab } from '@/components/research/ResearchTab';
import { VisionTab } from '@/components/vision/VisionTab';
import { ProductionTab } from '@/components/production/ProductionTab';
import { GeneratedPrompt } from '@/types';

export default function StockMasterDashboard() {
  // --- Dashboard State ---
  const [activeTab, setActiveTab] = useState('research');
  const [showSettings, setShowSettings] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);

  // --- AI Hook ---
  const ai = useAI();

  // --- Hydration Guard ---
  if (!ai.isMounted) return null;

  // --- Derived State ---
  const hasApiKey = (() => {
    switch (ai.selectedProvider) {
      case 'google': return !!ai.apiKey;
      case 'groq': return !!ai.groqApiKey;
      case 'mistral': return !!ai.mistralApiKey;
      case 'openrouter': return !!ai.openRouterApiKey;
      case 'nvidia': return !!ai.nvidiaApiKey;
      default: return false;
    }
  })();

  // --- Navigation Handlers ---
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
        
        {/* 1. Global Header */}
        <Header 
          hasApiKey={hasApiKey} 
          onSettingsClick={() => setShowSettings(!showSettings)} 
        />

        {/* 2. Settings Overlay */}
        {showSettings && (
          <SettingsPanel
            {...ai}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* 3. Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
          <TabNavigation />

          {/* Tab Content: Market Intelligence */}
          <TabsContent value="research" className="space-y-6 w-full">
            <ResearchTab 
              getAIClient={ai.getAIClient} 
              callAI={ai.callAI}
              apiKey={ai.apiKey}
              selectedProvider={ai.selectedProvider}
              onSendToProduction={handleSendToProduction} 
            />
          </TabsContent>

          {/* Tab Content: Vision Analysis */}
          <TabsContent value="vision" className="space-y-6 w-full">
            <VisionTab 
              getAIClient={ai.getAIClient} 
              callAI={ai.callAI}
              onSendToProduction={handleSendVisionToProduction} 
            />
          </TabsContent>

          {/* Tab Content: Batch Production */}
          <TabsContent value="production" className="space-y-6 w-full">
            <ProductionTab 
              getAIClient={ai.getAIClient} 
              callAI={ai.callAI}
              selectedModel={ai.selectedModel}
              selectedProvider={ai.selectedProvider}
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
