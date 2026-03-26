import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Activity, Target, AlertTriangle, CalendarDays, ImageIcon, ShieldAlert, Droplet, Tags, Copy, FileText, Rocket, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { ResearchResult, GroundingSource } from '@/types';
import { extractJSON } from '@/lib/utils';

interface ResearchTabProps {
  getAIClient: () => any;
  callAI: (options: any) => Promise<{ text: string; sources?: any[] }>;
  apiKey: string;
  selectedProvider: string;
  onSendToProduction: (nicheName: string) => void;
}

export function ResearchTab({ getAIClient, callAI, apiKey, selectedProvider, onSendToProduction }: ResearchTabProps) {
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

  useEffect(() => {
    try {
      const savedResearch = localStorage.getItem('stockmaster_research');
      if (savedResearch) setResearchResult(JSON.parse(savedResearch));
    } catch (e) {
      console.warn('Failed to load research from localStorage', e);
    }
  }, []);

  useEffect(() => {
    if (researchResult) {
      try {
        localStorage.setItem('stockmaster_research', JSON.stringify(researchResult));
      } catch (e) {
        console.warn('Failed to save research to localStorage (Quota Exceeded?)', e);
      }
    }
  }, [researchResult]);

  const handleResearch = async () => {
    if (!researchTopic.trim()) { toast.error('Please enter a topic.'); return; }
    setIsResearching(true); setResearchResult(null);
    
    try {
      const systemInstruction = `You are the World-Class Elite Microstock Market Analyst & Blue Ocean Strategy Expert for Adobe Stock. Your mission is to provide deep, data-driven market intelligence to find "Blue Ocean" opportunities—high-demand niches with low competition.

      YOUR ANALYSIS MUST COVER:
      1. "Market Intelligence": Current trends, cultural shifts, and industry needs driving demand.
      2. "Niche Discovery": Identification of highly specific sub-niches (long-tail keywords) with high conversion potential.
      3. "Technical Excellence": Technical quality standards required for the niche to avoid rejection.
      4. "Visual Composition Trends": Identify what framing, lighting, or copy space is currently selling.
      5. "Saturation Warning": Explicitly identify what NOT to create because it's oversaturated.
      
      CRITICAL: REJECTION RISKS CATEGORIZATION:
      You MUST categorize 'rejectionRisks' into these 3 specific areas:
      1. "Compositional Risks": Framing issues, poor lighting, lack of copy space, boring angles.
      2. "Technical Artifacts": AI artifacts, strange anatomy, noise, blur, over-sharpening, excessive chromatic aberration.
      3. "Content Violations": Copyright infringement, logos, trademarks, private property, faces without model releases.
      
      LANGUAGE MANDATE: All textual analysis, sub-niche names, reasons, and SEO tags MUST be in English.
      
      Output must be in JSON format matching this schema:
      {
        "trendScore": number,
        "saturationIndex": number,
        "demandLevel": string,
        "competitionLevel": string,
        "buyerPersona": string,
        "seasonality": string,
        "colorPalette": string[],
        "analysis": string,
        "subNiches": [{"name": string, "reason": string}],
        "visualRequirements": [{"category": string, "items": string[]}],
        "rejectionRisks": [{"category": string, "items": string[]}],
        "visualTrends": string[],
        "avoidCreating": string[],
        "titleTemplate": string,
        "seoTags": string[]
      }`;

      const prompt = `Perform a highly advanced microstock and Adobe Stock market intelligence analysis for the topic: "${researchTopic}". 
      Use real-time web search to gather current trends.
      
      Methodology:
      1. Keyword Effectiveness Index (KEI) Simulation: Identify high search volume vs. low supply gaps.
      2. Blue Ocean Strategy: Find uncontested sub-niches.
      3. Visual Trend Analysis: Identify currently selling compositions, lighting, and copy-space requirements.
      4. Saturation Warning: Identify what specific angles/subjects to AVOID because they are oversupplied.
      
      Analyze market demand, competition levels, saturation, buyer personas (who buys this?), psychologically trending color palettes, and find "Blue Ocean" gaps where demand is high but supply/competition is low.
      Provide 5 most profitable "Blue Ocean" sub-niche recommendations with strong commercial justifications.
      
      Ensure all output is in English.`;

      const { text, sources } = await callAI({
        prompt,
        system: systemInstruction,
        temperature: 0.4,
        jsonMode: true,
        maxTokens: 4000,
        useSearch: true // Aktifkan Web Grounding (Gemini Native atau Groq via Tool)
      });

      if (text) {
        try {
          const cleanedText = extractJSON(text);
          console.log("Extracted JSON:", cleanedText);
          let parsedResult = JSON.parse(cleanedText);
          
          // Jika AI mengembalikan array, ambil elemen pertama (biasanya objek riset)
          if (Array.isArray(parsedResult) && parsedResult.length > 0) {
            parsedResult = parsedResult[0];
          }
          
          // Validasi minimal untuk memastikan data tidak kosong dan memiliki struktur yang benar
          if (!parsedResult || typeof parsedResult !== 'object') {
            throw new Error("Hasil riset bukan merupakan objek data yang valid.");
          }

          if (typeof parsedResult.trendScore !== 'number') {
            console.error("Data hasil riset tidak lengkap (missing trendScore):", parsedResult);
            throw new Error("AI mengembalikan data yang tidak lengkap. Pastikan topik yang dimasukkan cukup spesifik.");
          }

          // Attach sources if available
          if (sources && sources.length > 0) {
            parsedResult.sources = sources;
          }

          setResearchResult(parsedResult as ResearchResult);
          toast.success('Market analysis completed successfully!');
        } catch (parseError: any) {
          console.error("Failed to parse research JSON:", parseError, "Original text:", text);
          toast.error(`Failed to process research results: ${parseError.message || 'Invalid format'}`);
        }
      }
    } catch (error: any) {
      toast.error(`Failed to perform market research: ${error.message || 'Check your API Key.'}`);
      console.error(error);
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6 sticky top-8">
        <Card className="bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-300 font-medium font-mono">Live Market Analysis</CardTitle>
            <CardDescription className="text-cyan-500/70 text-sm font-mono">Evaluasi potensi komersial berdasarkan data real-time dari internet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="researchTopic" className="text-cyan-300 font-medium font-mono">Topik / Niche</Label>
              <Input id="researchTopic" placeholder="Contoh: Remote Work, AI Technology..." value={researchTopic} onChange={(e) => setResearchTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleResearch()} className="bg-[#050505] border-cyan-500/50 text-cyan-50 focus-visible:ring-cyan-400/50 font-mono" />
            </div>
            <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold font-mono" size="lg" onClick={handleResearch} disabled={isResearching || !researchTopic.trim()}>
              {isResearching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Browsing Live Data...</> : <><Globe className="w-4 h-4 mr-2" /> Analisis Real-Time</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-8">
        {researchResult ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento Grid Analytics */}
            <Card className="md:col-span-2 bg-[#0a0a0a] border-cyan-500/30 text-cyan-50 relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-cyan-900/50 mb-4">
                <div>
                  <CardTitle className="text-cyan-300 flex items-center gap-2 font-mono"><TrendingUp className="w-5 h-5 text-fuchsia-500 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" /> Market Intelligence Report</CardTitle>
                  <CardDescription className="text-cyan-500/70 text-[10px] mt-1 font-mono uppercase tracking-widest">Analisis mendalam berdasarkan data pasar terbaru.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-950/80 text-cyan-300 text-[10px] px-2.5 py-1 rounded-full border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] flex items-center gap-1.5 font-mono uppercase tracking-wider backdrop-blur-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${researchResult.sources && researchResult.sources.length > 0 ? 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-fuchsia-500/80 shadow-[0_0_8px_rgba(217,70,239,0.4)]'}`}></span> {researchResult.sources && researchResult.sources.length > 0 ? 'Live Web Grounded' : 'Internal AI Knowledge'}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setResearchResult(null); localStorage.removeItem('stockmaster_research'); toast.success('Research data cleared'); }} className="h-7 text-[10px] text-red-400 border-red-500/50 hover:text-red-300 hover:bg-red-950/50 font-mono px-2">Clear</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-full border border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.15)] flex items-center justify-center bg-[#050505]">
                      <span className="text-5xl font-light text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)] tracking-tighter font-mono">{researchResult.trendScore ?? 0}</span>
                    </div>
                    <span className="text-[10px] text-cyan-500/70 mt-3 uppercase tracking-widest font-semibold font-mono">Trend Score</span>
                  </div>
                  <div className="space-y-4 flex-1 w-full">
                    <div>
                      <h3 className="text-xl font-semibold mb-1 text-cyan-300 font-mono">Commercial Analysis</h3>
                      <p className="text-cyan-100/80 text-sm leading-relaxed">{researchResult.analysis || 'Tidak ada analisis tersedia.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-cyan-500/20">
                      <div className="space-y-1.5"><div className="flex items-center gap-2 text-cyan-500/70 text-[10px] uppercase tracking-widest font-semibold font-mono"><Activity className="w-3.5 h-3.5 text-fuchsia-500" /> Demand</div><div className="font-medium text-cyan-100 text-sm">{researchResult.demandLevel || '-'}</div></div>
                      <div className="space-y-1.5"><div className="flex items-center gap-2 text-cyan-500/70 text-[10px] uppercase tracking-widest font-semibold font-mono"><Target className="w-3.5 h-3.5 text-fuchsia-500" /> Competition</div><div className="font-medium text-cyan-100 text-sm">{researchResult.competitionLevel || '-'}</div></div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-cyan-500/70 text-[10px] uppercase tracking-widest font-semibold font-mono"><AlertTriangle className="w-3.5 h-3.5 text-fuchsia-500" /> Saturation</div>
                        <div className="font-medium text-cyan-100 text-sm flex items-center gap-2">
                          {(researchResult.saturationIndex ?? 0)}% 
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            (researchResult.saturationIndex ?? 0) > 70 ? 'bg-red-950/50 text-red-400 border-red-500/50' : 
                            (researchResult.saturationIndex ?? 0) > 40 ? 'bg-yellow-950/50 text-yellow-400 border-yellow-500/50' : 
                            'bg-emerald-950/50 text-emerald-400 border-emerald-500/50'
                          }`}>
                            {(researchResult.saturationIndex ?? 0) > 70 ? 'High Risk' : (researchResult.saturationIndex ?? 0) > 40 ? 'Medium' : 'Healthy'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5"><div className="flex items-center gap-2 text-cyan-500/70 text-[10px] uppercase tracking-widest font-semibold font-mono"><CalendarDays className="w-3.5 h-3.5 text-fuchsia-500" /> Seasonality</div><div className="font-medium text-cyan-100 text-sm">{researchResult.seasonality || '-'}</div></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sub Niches */}
            <Card className="md:col-span-2 bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-cyan-300 font-mono"><Target className="w-5 h-5 text-fuchsia-500" /> Blue Ocean Sub-Niches</CardTitle>
                <CardDescription className="text-cyan-500/70 text-sm font-mono">Celah pasar (uncontested market space) dengan kompetisi rendah dan permintaan tinggi.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {researchResult.subNiches?.map((niche, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-cyan-500/20 bg-[#050505] hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 gap-4 group">
                      <div className="space-y-1.5 flex-1">
                        <div className="font-medium text-cyan-100 flex items-center gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-cyan-950/50 text-cyan-300 flex items-center justify-center text-[10px] font-mono border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]">{i+1}</span>{niche.name}</div>
                        <p className="text-xs text-cyan-500/70 pl-9 leading-relaxed">{niche.reason}</p>
                      </div>
                      <Button size="sm" className="shrink-0 bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-400 hover:text-black shadow-[0_0_10px_rgba(6,182,212,0)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 font-mono" onClick={() => onSendToProduction(niche.name)}><Rocket className="w-3.5 h-3.5 mr-2" /> Send to Production</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Requirements & Risks */}
            <Card className="bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2 text-cyan-300 font-mono"><ImageIcon className="w-5 h-5 text-fuchsia-500" /> Visual Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {researchResult.visualRequirements?.map((reqCat, i) => (
                    <div key={i} className="space-y-2">
                      <h4 className="text-sm font-medium text-cyan-300 border-b border-cyan-500/30 pb-1 font-mono">{reqCat.category}</h4>
                      <ul className="space-y-1.5 pl-2">
                        {reqCat.items?.map((item, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <span className="text-fuchsia-500 mt-0.5">•</span>
                            <span className="text-cyan-100/80 leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-5 rounded-xl border border-red-500/40 bg-red-950/20 shadow-[inset_0_0_20px_rgba(248,113,113,0.05)]">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-5 text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)] uppercase tracking-widest font-mono"><ShieldAlert className="w-4 h-4" /> Critical Rejection Risks</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {researchResult.rejectionRisks?.map((riskCat, i) => (
                      <div key={i} className="space-y-3 bg-[#050505] p-4 rounded-lg border border-red-500/20">
                        <h4 className="text-[10px] font-bold text-red-400/70 border-b border-red-500/20 pb-2 uppercase tracking-widest font-mono">{riskCat.category}</h4>
                        <ul className="space-y-2.5 pt-1">
                          {riskCat.items?.map((item, j) => (
                            <li key={j} className="text-xs flex items-start gap-2.5">
                              <span className="text-red-500/50 mt-0.5 shrink-0 text-[10px]">✕</span>
                              <span className="text-cyan-100/80 leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 border-t border-cyan-500/20">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-4 text-cyan-400 uppercase tracking-widest font-mono"><Droplet className="w-4 h-4 text-fuchsia-500" /> Trending Colors</div>
                  <div className="flex flex-wrap gap-2.5">
                    {researchResult.colorPalette?.map((color, i) => (<span key={i} className="px-3 py-1.5 bg-cyan-950/30 text-cyan-300 text-xs rounded-md border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.1)] font-mono flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_5px_rgba(217,70,239,0.8)]"></div>{color}</span>))}
                  </div>
                </div>

                {researchResult.visualTrends && researchResult.visualTrends.length > 0 && (
                  <div className="pt-6 border-t border-cyan-500/20">
                    <div className="flex items-center gap-2 text-xs font-semibold mb-4 text-emerald-400 uppercase tracking-widest font-mono"><ImageIcon className="w-4 h-4 text-emerald-500" /> Current Visual Trends</div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {researchResult.visualTrends.map((trend, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 bg-emerald-950/10 p-3 rounded-lg border border-emerald-500/20">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span className="text-cyan-100/80 leading-snug">{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {researchResult.avoidCreating && researchResult.avoidCreating.length > 0 && (
                  <div className="pt-6 border-t border-cyan-500/20">
                    <div className="flex items-center gap-2 text-xs font-semibold mb-4 text-orange-400 uppercase tracking-widest font-mono"><AlertTriangle className="w-4 h-4 text-orange-500" /> Saturation Warning: Do Not Create</div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {researchResult.avoidCreating.map((avoid, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 bg-orange-950/10 p-3 rounded-lg border border-orange-500/20">
                          <span className="text-orange-500 mt-0.5">✕</span>
                          <span className="text-cyan-100/80 leading-snug">{avoid}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO Tags & Title */}
            <Card className="bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
              <CardHeader className="pb-3 flex flex-col space-y-5">
                <div className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-cyan-300 font-mono"><Tags className="w-5 h-5 text-fuchsia-500" /> SEO Metadata</CardTitle>
                  <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-100 hover:bg-cyan-950/50" onClick={() => { navigator.clipboard.writeText(`${researchResult.titleTemplate}\n\n${researchResult.seoTags.join(', ')}`); toast.success('Disalin!'); }}><Copy className="w-4 h-4" /></Button>
                </div>
                <div className="bg-[#050505] p-4 rounded-xl border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-cyan-500/70 mb-2 uppercase tracking-widest font-mono"><FileText className="w-3.5 h-3.5 text-fuchsia-500" /> Optimized Title Template</div>
                  <p className="text-sm text-cyan-100 font-medium leading-relaxed">{researchResult.titleTemplate}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {researchResult.seoTags?.map((tag, i) => (<span key={i} className="px-2.5 py-1 bg-[#050505] text-cyan-400 text-xs rounded-md border border-cyan-500/30 hover:border-cyan-400/80 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-colors font-mono">{tag}</span>))}
                </div>
                
                {researchResult.sources && researchResult.sources.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-cyan-500/20">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-400 mb-3 uppercase tracking-widest font-mono">
                      <Globe className="w-3.5 h-3.5" /> Live Web Sources
                    </div>
                    <ul className="space-y-2">
                      {researchResult.sources.map((source, i) => (
                        <li key={i} className="text-xs text-cyan-500/70 hover:text-cyan-300 transition-colors truncate">
                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <span className="text-emerald-500/50">↗</span> {source.title || source.uri}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-dashed border-cyan-500/30 bg-[#0a0a0a]">
            <Globe className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
            <p className="text-sm font-mono">Mulai riset untuk menarik data real-time dari internet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
