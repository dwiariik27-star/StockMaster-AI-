import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Paintbrush, ShieldAlert, Info, Loader2 } from 'lucide-react';
import { CATEGORIES, ASPECT_RATIOS } from '@/types';

export function ProductionControls({
  keyword, setKeyword, category, setCategory, aspectRatio, setAspectRatio,
  targetCount, setTargetCount, creativity, setCreativity, isCohesive, setIsCohesive,
  negativePromptBias, setNegativePromptBias, isBatching, batchStatus, currentCount,
  handleGenerate, handleCancel
}: any) {
  return (
    <Card className="bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
      <CardHeader>
        <CardTitle className="text-cyan-300 font-mono">Parametric Production Engine</CardTitle>
        <CardDescription className="text-cyan-500/70 text-sm font-mono">Kunci spesifikasi teknis untuk merender 10 masterpiece.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="productionKeyword" className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">Niche / Sub-Niche Target</Label>
          <Input id="productionKeyword" placeholder="Contoh: Virtual business meeting..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 transition-colors font-mono" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category" className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">Kategori Aset</Label>
          <Select value={category} onValueChange={(val) => val && setCategory(val)}>
            <SelectTrigger id="category" className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-50 transition-colors font-mono"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-50 font-mono">{CATEGORIES.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        
        <div className="pt-6 border-t border-cyan-500/30 space-y-5">
          <Label className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-2 font-mono"><Paintbrush className="w-3.5 h-3.5 text-fuchsia-500" /> Parametric Controls</Label>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={(val) => val && setAspectRatio(val)}>
                <SelectTrigger className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">
                  {ASPECT_RATIOS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-cyan-500/30">
            <Label className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 font-mono"><Sparkles className="w-3 h-3 text-fuchsia-500" /> Target Auto-Batching (Max 1000)</Label>
            <Input type="number" min={10} max={1000} step={10} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} className="h-8 text-xs bg-[#050505] border-cyan-500/50 text-cyan-300 focus-visible:ring-cyan-400/50 font-mono" />
          </div>
          <div className="space-y-2 pt-2 border-t border-cyan-500/30">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 font-mono"><Sparkles className="w-3 h-3 text-fuchsia-500" /> Creativity Level</Label>
              <span className="text-xs text-cyan-500/70 font-mono">{creativity}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="150" 
              step="5"
              value={creativity} 
              onChange={(e) => setCreativity(Number(e.target.value))}
              className="w-full h-1.5 bg-cyan-950/50 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-cyan-500/30">
            <div className="space-y-0.5">
              <Label className="text-xs text-cyan-400 font-bold font-mono">Cohesive Collection Mode</Label>
              <p className="text-[10px] text-cyan-500/70 font-mono">Gunakan model/objek yang sama dalam satu batch.</p>
            </div>
            <Switch 
              checked={isCohesive} 
              onCheckedChange={setIsCohesive}
              className="data-[state=checked]:bg-fuchsia-500"
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-fuchsia-400 font-bold flex items-center gap-1 font-mono">
                  <ShieldAlert className="w-3 h-3 text-fuchsia-500" /> Negative Prompt Bias
                </Label>
                <div className="group relative">
                  <Info className="w-3 h-3 text-cyan-500/50 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#0a0a0a] border border-cyan-500/50 rounded text-[10px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono">
                    Meningkatkan spesifisitas dan teknis dalam negative prompt. Mengurangi halusinasi AI tetapi mungkin membatasi output kreatif.
                  </div>
                </div>
              </div>
              <span className="text-xs text-cyan-500/70 font-mono">{negativePromptBias}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={negativePromptBias} 
              onChange={(e) => setNegativePromptBias(Number(e.target.value))}
              className="w-full h-1.5 bg-cyan-950/50 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
            />
          </div>
        </div>

        {isBatching ? (
          <Button className="w-full bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50 border border-cyan-500/50 mt-4 font-mono font-medium shadow-[0_0_10px_rgba(6,182,212,0.2)]" size="lg" onClick={handleCancel}>
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-fuchsia-500" /> {batchStatus} ({currentCount}/{targetCount})
          </Button>
        ) : (
          <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 mt-4 font-bold font-mono shadow-[0_0_15px_rgba(6,182,212,0.4)]" size="lg" onClick={handleGenerate} disabled={!keyword.trim()}>
            <Sparkles className="w-4 h-4 mr-2" /> Mulai Auto-Batching
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
