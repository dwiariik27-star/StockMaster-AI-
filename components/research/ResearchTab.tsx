import { useState, useEffect } from 'react';
import { Type, ThinkingLevel } from '@google/genai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Activity, Target, AlertTriangle, CalendarDays, ImageIcon, ShieldAlert, Droplet, Tags, Copy, FileText, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchResult, GroundingSource } from '@/types';

interface ResearchTabProps {
  getAIClient: () => any;
  onSendToProduction: (nicheName: string) => void;
}

export function ResearchTab({ getAIClient, onSendToProduction }: ResearchTabProps) {
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

  useEffect(() => {
    const savedResearch = localStorage.getItem('stockmaster_research');
    if (savedResearch) setResearchResult(JSON.parse(savedResearch));
  }, []);

  useEffect(() => {
    if (researchResult) localStorage.setItem('stockmaster_research', JSON.stringify(researchResult));
  }, [researchResult]);

  const handleResearch = async () => {
    if (!researchTopic.trim()) { toast.error('Silakan masukkan topik.'); return; }
    setIsResearching(true); setResearchResult(null);
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Fallback to flash for better compatibility
        contents: `Lakukan pencarian web real-time untuk tren microstock dan Adobe Stock terbaru terkait topik: "${researchTopic}". Terapkan metode "Niche Market" dan "Blue Ocean Strategy". Analisis tingkat permintaan pasar, tingkat kompetisi, kejenuhan pasar, persona pembeli, palet warna yang sedang tren, dan temukan celah pasar (uncontested market space) di mana permintaan tinggi namun kompetisi/suplai aset masih sangat rendah untuk menghasilkan rekomendasi sub-niche "Blue Ocean" yang paling menguntungkan berdasarkan data internet terbaru.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `Anda adalah Elite Microstock Market Analyst dan Pakar Blue Ocean Strategy. Anda MEMILIKI AKSES INTERNET. Wajib gunakan alat pencarian (Google Search) untuk mencari data tren Adobe Stock terbaru. Berikan analisis yang sangat mendalam, temukan celah pasar yang belum banyak digarap kompetitor (Blue Ocean), dan berorientasi pada penjualan komersial tinggi.`,
          temperature: 0.4,
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trendScore: { type: Type.INTEGER, description: "Skor potensi komersial (1-100)" },
              saturationIndex: { type: Type.INTEGER, description: "Indeks kejenuhan pasar (1-100)." },
              demandLevel: { type: Type.STRING, description: "Tinggi, Sedang, atau Rendah" },
              competitionLevel: { type: Type.STRING, description: "Tinggi, Sedang, atau Rendah" },
              buyerPersona: { type: Type.STRING, description: "Target pembeli utama aset ini" },
              seasonality: { type: Type.STRING, description: "Evergreen atau Seasonal?" },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 warna tren" },
              analysis: { type: Type.STRING, description: "Analisis tajam mengapa topik ini laku dan bagaimana strategi Blue Ocean-nya" },
              subNiches: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["name", "reason"] },
                description: "3-5 sub-niche 'Blue Ocean' spesifik (permintaan tinggi, kompetisi rendah)"
              },
              visualRequirements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 elemen visual spesifik" },
              rejectionRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 hal yang HARUS DIHINDARI agar tidak ditolak Adobe Stock" },
              titleTemplate: { type: Type.STRING, description: "Satu template judul SEO Adobe Stock (maks 70 karakter)" },
              seoTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "10-15 kata kunci SEO" }
            },
            required: ["trendScore", "saturationIndex", "demandLevel", "competitionLevel", "buyerPersona", "seasonality", "colorPalette", "analysis", "subNiches", "visualRequirements", "rejectionRisks", "titleTemplate", "seoTags"]
          }
        },
      });

      const text = response.text;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: GroundingSource[] = [];
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title && !sources.find(s => s.uri === chunk.web.uri)) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      if (text) {
        const parsedResult = JSON.parse(text) as ResearchResult;
        parsedResult.sources = sources;
        setResearchResult(parsedResult);
        toast.success('Analisis pasar super cerdas berhasil diselesaikan!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal melakukan riset pasar.');
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6 sticky top-8">
        <Card className="bg-slate-900/50 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-400 font-mono">Live Market Analysis</CardTitle>
            <CardDescription className="text-cyan-500/70 font-mono text-xs">Evaluasi potensi komersial berdasarkan data real-time dari internet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="researchTopic" className="text-cyan-300 font-mono">Topik / Niche</Label>
              <Input id="researchTopic" placeholder="Contoh: Remote Work, AI Technology..." value={researchTopic} onChange={(e) => setResearchTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResearch()} className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 font-mono" />
            </div>
            <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold" size="lg" onClick={handleResearch} disabled={isResearching || !researchTopic.trim()}>
              {isResearching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Browsing Live Data...</> : <><Globe className="w-4 h-4 mr-2" /> Analisis Real-Time</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        {researchResult ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento Grid Analytics */}
            <Card className="md:col-span-2 bg-[#050505] border-cyan-500/30 text-cyan-50 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <div className="absolute top-4 right-4 bg-fuchsia-500/10 text-fuchsia-400 text-xs px-3 py-1 rounded-full border border-fuchsia-500/30 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_5px_rgba(217,70,239,0.8)]"></span> Live Web Grounded
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-full border-4 border-cyan-500 flex items-center justify-center bg-cyan-950/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.5),0_0_15px_rgba(6,182,212,0.5)]">
                      <span className="text-4xl font-bold text-cyan-400 font-mono">{researchResult.trendScore}</span>
                    </div>
                    <span className="text-xs text-cyan-500/70 mt-2 uppercase tracking-wider font-semibold font-mono">Trend Score</span>
                  </div>
                  <div className="space-y-4 flex-1 w-full">
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-cyan-300 font-mono">Commercial Analysis</h3>
                      <p className="text-cyan-50/80 text-sm leading-relaxed">{researchResult.analysis}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyan-500/20">
                      <div className="space-y-1"><div className="flex items-center gap-2 text-cyan-500/70 text-xs uppercase tracking-wider font-mono"><Activity className="w-3 h-3 text-fuchsia-500" /> Demand</div><div className="font-medium text-cyan-50">{researchResult.demandLevel}</div></div>
                      <div className="space-y-1"><div className="flex items-center gap-2 text-cyan-500/70 text-xs uppercase tracking-wider font-mono"><Target className="w-3 h-3 text-fuchsia-500" /> Competition</div><div className="font-medium text-cyan-50">{researchResult.competitionLevel}</div></div>
                      <div className="space-y-1"><div className="flex items-center gap-2 text-cyan-500/70 text-xs uppercase tracking-wider font-mono"><AlertTriangle className="w-3 h-3 text-fuchsia-500" /> Saturation</div><div className="font-medium text-cyan-50">{researchResult.saturationIndex}% <span className="text-xs ml-2 text-cyan-500/50">({researchResult.saturationIndex > 70 ? 'High' : 'Healthy'})</span></div></div>
                      <div className="space-y-1"><div className="flex items-center gap-2 text-cyan-500/70 text-xs uppercase tracking-wider font-mono"><CalendarDays className="w-3 h-3 text-fuchsia-500" /> Seasonality</div><div className="font-medium text-cyan-50 text-sm">{researchResult.seasonality}</div></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sub Niches */}
            <Card className="md:col-span-2 bg-slate-900/50 border-cyan-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-cyan-400 font-mono"><Target className="w-5 h-5 text-fuchsia-500" /> Blue Ocean Sub-Niches</CardTitle>
                <CardDescription className="text-cyan-500/70 font-mono text-xs">Celah pasar (uncontested market space) dengan kompetisi rendah dan permintaan tinggi.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {researchResult.subNiches.map((niche, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-cyan-500/10 bg-[#050505] hover:border-cyan-500/50 transition-colors gap-4 group">
                      <div className="space-y-1 flex-1">
                        <div className="font-semibold text-cyan-50 flex items-center gap-2 font-mono"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xs shadow-[0_0_5px_rgba(6,182,212,0.3)]">{i+1}</span>{niche.name}</div>
                        <p className="text-xs text-cyan-50/60 pl-7">{niche.reason}</p>
                      </div>
                      <Button size="sm" className="shrink-0 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500 hover:text-black group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all font-mono" onClick={() => onSendToProduction(niche.name)}><Rocket className="w-4 h-4 mr-2" /> Send to Production</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Requirements & Risks */}
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2 text-cyan-400 font-mono"><ImageIcon className="w-5 h-5 text-fuchsia-500" /> Visual Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-2">
                  {researchResult.visualRequirements.map((req, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-cyan-500 font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">•</span><span className="text-cyan-50/80">{req}</span></li>))}
                </ul>
                <div className="pt-4 border-t border-cyan-500/20">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3 text-red-400 font-mono"><ShieldAlert className="w-4 h-4 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]" /> Rejection Risks (AVOID)</div>
                  <ul className="space-y-2">
                    {researchResult.rejectionRisks.map((risk, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-red-500 font-bold drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">✕</span><span className="text-cyan-50/80">{risk}</span></li>))}
                  </ul>
                </div>
                <div className="pt-4 border-t border-cyan-500/20">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3 text-cyan-300 font-mono"><Droplet className="w-4 h-4 text-fuchsia-500" /> Trending Colors</div>
                  <div className="flex flex-wrap gap-2">
                    {researchResult.colorPalette.map((color, i) => (<span key={i} className="px-3 py-1 bg-cyan-950/30 text-cyan-300 text-xs rounded-md border border-cyan-500/30 font-mono shadow-[0_0_5px_rgba(6,182,212,0.1)]">{color}</span>))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Tags & Title */}
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader className="pb-3 flex flex-col space-y-4">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-cyan-400 font-mono"><Tags className="w-5 h-5 text-fuchsia-500" /> SEO Metadata</CardTitle>
                  <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" onClick={() => { navigator.clipboard.writeText(`${researchResult.titleTemplate}\n\n${researchResult.seoTags.join(', ')}`); toast.success('Disalin!'); }}><Copy className="w-4 h-4" /></Button>
                </div>
                <div className="bg-[#050505] p-3 rounded-md border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-500/80 mb-1 font-mono"><FileText className="w-3 h-3 text-fuchsia-500" /> Optimized Title Template</div>
                  <p className="text-sm text-cyan-50 font-medium">{researchResult.titleTemplate}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {researchResult.seoTags.map((tag, i) => (<span key={i} className="px-2 py-1 bg-[#050505] text-cyan-50/80 text-xs rounded-md border border-cyan-500/20 hover:border-cyan-500/50 transition-colors font-mono">{tag}</span>))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-dashed border-cyan-500/30 bg-slate-900/20">
            <Globe className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
            <p className="font-mono text-sm">Mulai riset untuk menarik data real-time dari internet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
