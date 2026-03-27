import { useState, useEffect, useRef } from 'react';
import { generateSystemInstruction } from '@/lib/prompt-factory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Palette, Save, Copy, Download, ShieldAlert, Box, CheckCircle2, Paintbrush, Eye, Info, Target } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedPrompt, CATEGORIES, LIGHTING_STYLES, CAMERA_ANGLES, COLOR_TONES, ASPECT_RATIOS, COMPOSITIONS, DEPTH_OF_FIELD, CAMERA_MOTION, LENS_FLARE, BOKEH_INTENSITY, FILM_GRAIN, CHROMATIC_ABERRATION, COLOR_BLEED } from '@/types';
import { extractJSON } from '@/lib/utils';

interface ProductionTabProps {
  getAIClient: () => any;
  callAI: (options: any) => Promise<{ text: string; sources?: any[] }>;
  selectedModel: string;
  selectedProvider: string;
  keyword: string;
  setKeyword: (kw: string) => void;
  generatedPrompts: GeneratedPrompt[];
  setGeneratedPrompts: (prompts: GeneratedPrompt[]) => void;
}

export function ProductionTab({ 
  getAIClient, 
  callAI,
  selectedModel, 
  selectedProvider,
  keyword, 
  setKeyword,
  generatedPrompts,
  setGeneratedPrompts 
}: ProductionTabProps) {
  const [category, setCategory] = useState('commercial-photo');
  const [lightingStyle, setLightingStyle] = useState('Auto/AI Choice');
  const [cameraAngle, setCameraAngle] = useState('Auto/AI Choice');
  const [colorTone, setColorTone] = useState('Auto/AI Choice');
  const [aspectRatio, setAspectRatio] = useState('Auto/AI Choice');
  const [composition, setComposition] = useState('Auto/AI Choice');
  const [depthOfField, setDepthOfField] = useState('Auto/AI Choice');
  const [cameraMotion, setCameraMotion] = useState('Auto/AI Choice');
  const [lensFlare, setLensFlare] = useState('Auto/AI Choice');
  const [bokehIntensity, setBokehIntensity] = useState('Auto/AI Choice');
  const [filmGrain, setFilmGrain] = useState('Auto/AI Choice');
  const [chromaticAberration, setChromaticAberration] = useState('Auto/AI Choice');
  const [colorBleed, setColorBleed] = useState('Auto/AI Choice');
  const [targetCount, setTargetCount] = useState<number>(50);
  const [creativity, setCreativity] = useState<number>(55);
  const [negativePromptBias, setNegativePromptBias] = useState<number>(80);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isBatching, setIsBatching] = useState(false);
  const [isCohesive, setIsCohesive] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [marketIntel, setMarketIntel] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const GOOGLE_MODELS = [
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it'
  ];

  const MISTRAL_MODELS = [
    'mistral-large-latest',
    'mistral-small-latest',
    'pixtral-12b-2409',
    'ministral-8b-latest',
    'ministral-3b-latest',
    'codestral-latest'
  ];

  const OPENROUTER_MODELS = [
    'google/gemini-2.5-flash:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'mistralai/mistral-nemo:free',
    'qwen/qwen-2.5-72b-instruct:free'
  ];

  const NVIDIA_MODELS = [
    'meta/llama-3.1-70b-instruct',
    'meta/llama-3.1-8b-instruct',
    'mistralai/mistral-large-2-instruct',
    'mistralai/mixtral-8x22b-instruct-v0.1',
    'google/gemma-2-27b-it',
    'google/gemma-2-9b-it'
  ];

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    setActiveModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (marketIntel.length > 0) {
      try {
        localStorage.setItem('stockmaster_market_intel', JSON.stringify(marketIntel));
      } catch (e) {
        console.warn('Failed to save market intel to localStorage (Quota Exceeded?)', e);
      }
    }
  }, [marketIntel]);

  useEffect(() => {
    try {
      const savedPrompts = localStorage.getItem('stockmaster_prompts');
      if (savedPrompts) setGeneratedPrompts(JSON.parse(savedPrompts));
    } catch (e) {
      console.warn('Failed to load prompts from localStorage', e);
    }
  }, [setGeneratedPrompts]);

  useEffect(() => {
    if (generatedPrompts.length > 0) {
      try {
        localStorage.setItem('stockmaster_prompts', JSON.stringify(generatedPrompts));
      } catch (e) {
        console.warn('Failed to save prompts to localStorage (Quota Exceeded?)', e);
        toast.error('Storage penuh. Prompt terbaru mungkin tidak tersimpan secara lokal.');
      }
    }
  }, [generatedPrompts]);

  const handleGenerate = async () => {
    if (!keyword.trim()) { toast.error('Please enter a trend keyword.'); return; }
    if (targetCount < 10 || targetCount > 1000) { toast.error('Target prompts must be between 10 - 1000.'); return; }
    
    setIsBatching(true);
    setCurrentCount(0);
    setGeneratedPrompts([]);
    setMarketIntel([]);
    setBatchStatus('Performing Market Intelligence & Niche Analysis...');
    
    abortControllerRef.current = new AbortController();
    let accumulatedPrompts: GeneratedPrompt[] = [];
    const exhaustedModels = new Set<string>();

    try {
      // 1. Market Intelligence & Niche Discovery Phase
      let dynamicThemes: string[] = [];
      try {
        const { text: intelText } = await callAI({
          prompt: `Sebagai Master Commercial Art Director, lakukan analisis intelijen pasar untuk kata kunci: "${keyword}" dalam kategori "${CATEGORIES.find(c => c.id === category)?.name}".
          
          TUGAS:
          1. Identifikasi 5 sub-niche atau "angle" komersial yang memiliki permintaan tinggi (high demand) namun persaingan rendah (low competition) di Adobe Stock, dengan fokus pada estetika LUXURY dan HIGH-DETAIL.
          2. Untuk setiap sub-niche, buat 2 variasi tema visual yang kontras namun tetap dalam standar premium (Total 10 tema).
          
          FORMAT OUTPUT (JSON Array of Strings):
          WAJIB: Hanya berikan array JSON murni tanpa teks penjelasan di awal atau akhir.
          ["Sub-niche 1: Tema A - Deskripsi...", "Sub-niche 1: Tema B - Deskripsi...", ...]
          
          Fokus pada: "Luxury Utility", "Premium Copy Space", "High-End Authenticity", dan "Technical Perfection".`,
          jsonMode: true,
          maxTokens: 2000
        });
        
        if (intelText) {
          try {
            const cleanedIntelText = extractJSON(intelText);
            console.log("Production Market Intel JSON:", cleanedIntelText);
            let parsedIntel = JSON.parse(cleanedIntelText);
            
            if (Array.isArray(parsedIntel)) {
              dynamicThemes = parsedIntel;
            } else if (parsedIntel && typeof parsedIntel === 'object') {
              const arrayProp = Object.values(parsedIntel).find(v => Array.isArray(v)) as string[];
              if (arrayProp) {
                dynamicThemes = arrayProp;
              } else {
                dynamicThemes = Object.values(parsedIntel).map(v => typeof v === 'string' ? v : JSON.stringify(v));
              }
            } else if (typeof parsedIntel === 'string') {
              dynamicThemes = [parsedIntel];
            }

            if (!Array.isArray(dynamicThemes) || dynamicThemes.length === 0) {
              throw new Error("Market intel output is not a valid array");
            }
            setMarketIntel(dynamicThemes);
          } catch (parseError) {
            console.error("Failed to parse market intel JSON:", parseError, "Original text:", intelText);
            // Fallback inside catch
            dynamicThemes = [
              "Elite Authentic Lifestyle: Fokus pada kemewahan sehari-hari, emosi natural yang elegan.",
              "Ultra-Minimalist Executive: Ruang kerja high-end, material premium, pencahayaan arsitektural.",
              "Cinematic Luxury Noir: Pencahayaan dramatis, kontras tinggi, palet warna deep jewel tones.",
              "Hyper-Realistic Premium Macro: Detail ekstrem pada material mewah (emas, sutra, kristal).",
              "Sophisticated Tech & Data: Visualisasi masa depan yang bersih, glowing lines, estetika Apple-esque.",
              "Sustainable Luxury: Material organik premium, palet warna bumi yang diredam, kemewahan ramah lingkungan.",
              "Exclusive Nightlife: Warna berani yang terkurasi, pantulan cahaya pada permukaan mewah, energi malam kelas atas.",
              "Zen Sanctuary & Wellness: Komposisi simetris sempurna, warna pastel premium, elemen spa mewah.",
              "Dynamic High-End Action: Angle ekstrem yang elegan, motion blur halus, subjek tajam membeku.",
              "Pure Luxury & Opulence: Palet warna gelap/emas, pencahayaan studio kelas dunia, materialitas tanpa cela."
            ];
            setMarketIntel(dynamicThemes);
          }
        }
      } catch (e) {
        console.error("Failed to generate market intel, using fallback.", e);
        if (!dynamicThemes || dynamicThemes.length === 0) {
          dynamicThemes = [
            "Elite Authentic Lifestyle: Fokus pada kemewahan sehari-hari, emosi natural yang elegan.",
            "Ultra-Minimalist Executive: Ruang kerja high-end, material premium, pencahayaan arsitektural.",
            "Cinematic Luxury Noir: Pencahayaan dramatis, kontras tinggi, palet warna deep jewel tones.",
            "Hyper-Realistic Premium Macro: Detail ekstrem pada material mewah (emas, sutra, kristal).",
            "Sophisticated Tech & Data: Visualisasi masa depan yang bersih, glowing lines, estetika Apple-esque.",
            "Sustainable Luxury: Material organik premium, palet warna bumi yang diredam, kemewahan ramah lingkungan.",
            "Exclusive Nightlife: Warna berani yang terkurasi, pantulan cahaya pada permukaan mewah, energi malam kelas atas.",
            "Zen Sanctuary & Wellness: Komposisi simetris sempurna, warna pastel premium, elemen spa mewah.",
            "Dynamic High-End Action: Angle ekstrem yang elegan, motion blur halus, subjek tajam membeku.",
            "Pure Luxury & Opulence: Palet warna gelap/emas, pencahayaan studio kelas dunia, materialitas tanpa cela."
          ];
          setMarketIntel(dynamicThemes);
        }
      }

      // Removed local getSystemInstruction as it is now in PromptFactory

      let batchIndex = 0;
      while (accumulatedPrompts.length < targetCount) {
        if (abortControllerRef.current?.signal.aborted) {
          toast.info('Auto-Batching stopped by user.');
          break;
        }

        const remaining = targetCount - accumulatedPrompts.length;
        let currentBatchSize = Math.min(5, remaining);
        
        // Smart Model Rotation & Exhaustion Check
        let providerModels = GOOGLE_MODELS;
        if (selectedProvider === 'groq') providerModels = GROQ_MODELS;
        else if (selectedProvider === 'mistral') providerModels = MISTRAL_MODELS;
        else if (selectedProvider === 'openrouter') providerModels = OPENROUTER_MODELS;
        else if (selectedProvider === 'nvidia') providerModels = NVIDIA_MODELS;
        
        // Check if all models for this provider are exhausted
        if (exhaustedModels.size >= providerModels.length) {
          toast.error(`⚠️ SEMUA MODEL ${selectedProvider.toUpperCase()} TELAH MENCAPAI LIMIT. Produksi dihentikan otomatis.`);
          break;
        }

        let modelIdx = batchIndex % providerModels.length;
        let currentModelId = providerModels[modelIdx];
        
        // Skip exhausted models in rotation
        let skipCount = 0;
        while (exhaustedModels.has(currentModelId) && skipCount < providerModels.length) {
          modelIdx = (modelIdx + 1) % providerModels.length;
          currentModelId = providerModels[modelIdx];
          skipCount++;
        }

        setActiveModel(currentModelId);
        
        setBatchStatus(`Batching with ${currentModelId.split('/').pop()}... (${accumulatedPrompts.length}/${targetCount})`);
        
        // Cap temperature at 1.1 to ensure strict adherence to Adobe Stock Quality Mandate and JSON formatting
        const baseTemp = creativity / 100;
        const currentTemp = Math.min(baseTemp + (batchIndex / Math.max(1, Math.ceil(targetCount / 5))) * 0.3, 1.1);
        const currentTheme = dynamicThemes[batchIndex % dynamicThemes.length];

        let explorationInstruction = "";
        if (creativity < 50) {
          explorationInstruction = "PENTING: Tetap sangat konservatif dan patuh pada kata kunci. Jangan terlalu banyak berimajinasi di luar konteks.";
        } else if (creativity <= 100) {
          explorationInstruction = "PENTING: Berikan variasi konsep yang seimbang antara relevansi komersial dan kreativitas artistik.";
        } else {
          explorationInstruction = "PENTING: Eksplorasi konsep secara radikal! Gunakan kombinasi elemen yang tidak biasa, surealis, atau sangat artistik yang masih memiliki nilai jual.";
        }

        const cohesiveInstruction = isCohesive ? `
          WAJIB: Gunakan "Consistency Anchor". Pastikan semua prompt dalam batch ini menggunakan subjek/model yang sama (misal: "the same middle-aged Asian woman with short hair"), pakaian yang sama, dan di lokasi yang sama, namun dengan sudut kamera, ekspresi, dan aksi yang berbeda untuk menciptakan koleksi yang kohesif.
        ` : "";

        const dynamicInstruction = `\n\n--- INSTRUKSI BATCH ---\nWAJIB BERIKAN VARIASI YANG 100% BERBEDA DARI SEBELUMNYA. \nFOKUS KREATIF UNTUK BATCH INI: "${currentTheme}"\n${cohesiveInstruction}\nGunakan kombinasi subjek, angle, lighting, dan warna yang sangat acak dan unik berdasarkan fokus kreatif tersebut.\n${explorationInstruction}`;
        
        let retryCount = 0;
        const maxRetries = 2;
        let batchSuccess = false;

        while (!batchSuccess && retryCount <= maxRetries) {
          try {
            const { text: batchText } = await callAI({
              prompt: `Generate ${currentBatchSize} prompts for the category "${CATEGORIES.find(c => c.id === category)?.name}" with the keyword: "${keyword}".`,
              system: generateSystemInstruction(currentBatchSize, category === 'cinematic-video', {
                keyword,
                category,
                lightingStyle,
                cameraAngle,
                colorTone,
                aspectRatio,
                composition,
                depthOfField,
                cameraMotion,
                lensFlare,
                bokehIntensity,
                filmGrain,
                chromaticAberration,
                colorBleed,
              }) + dynamicInstruction,
              temperature: currentTemp,
              jsonMode: true,
              model: currentModelId,
              maxTokens: selectedProvider === 'groq' ? 4000 : (selectedProvider === 'mistral' ? 8000 : 12000)
            });

            if (batchText) {
              try {
                const cleanedBatchText = extractJSON(batchText);
                let newPrompts = JSON.parse(cleanedBatchText);
                
                if (!Array.isArray(newPrompts)) {
                  if (newPrompts && typeof newPrompts === 'object' && ('positivePrompt' in newPrompts || 'prompt' in newPrompts)) {
                    newPrompts = [newPrompts];
                  } else if (newPrompts && typeof newPrompts === 'object') {
                    const arrayProp = Object.values(newPrompts).find(v => Array.isArray(v));
                    if (arrayProp) {
                      newPrompts = arrayProp;
                    } else {
                      throw new Error("Batch output is not an array");
                    }
                  } else {
                    throw new Error("Batch output is not an array");
                  }
                }
                
                newPrompts = newPrompts.map((p: any) => {
                  if (typeof p === 'string') {
                    return { positivePrompt: p };
                  }
                  
                  const finalPositive = p.positivePrompt || p.prompt || p.description || p.text || `High quality commercial asset of ${keyword}`;
                  const finalNegative = p.negativePrompt || "ugly, deformed, artifacts, text, watermark, signature, blurry, out of focus, bad anatomy, bad proportions, bad lighting, overexposed, underexposed, noise, grain, gibberish";
                  const finalTitle = p.title || `Premium ${keyword} asset`;
                  const finalKeywords = Array.isArray(p.keywords) ? p.keywords : [];
                  
                  return { 
                    positivePrompt: finalPositive,
                    negativePrompt: finalNegative,
                    title: finalTitle,
                    keywords: finalKeywords
                  };
                });
                
                accumulatedPrompts = [...accumulatedPrompts, ...newPrompts];
                setGeneratedPrompts(accumulatedPrompts);
                setCurrentCount(accumulatedPrompts.length);
                batchSuccess = true;

                // Delay lebih lama untuk Groq agar tidak kena TPM rate limit (6000 TPM limit)
                if (selectedProvider === 'groq') {
                  await new Promise(resolve => setTimeout(resolve, 3000));
                }
              } catch (parseError) {
                console.error("Gagal parse batch JSON:", parseError, "Original text:", batchText);
                throw parseError;
              }
            }
          } catch (error: any) {
            const errorMsg = error.message || '';
            const isQuotaError = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('Rate limit') || errorMsg.includes('quota') || errorMsg.includes('decommissioned') || errorMsg.includes('does not exist');
            
            if (isQuotaError) {
              exhaustedModels.add(currentModelId);
              console.warn(`Model ${currentModelId} failed or reached limit. Added to exhausted list.`);
              toast.warning(`Model ${currentModelId.split('/').pop()} failed. Trying another model...`);
              
              // If we hit a quota/decommissioned error, immediately break out of the retry loop 
              // for THIS model and let the outer while loop pick the next model.
              break; 
            }

            console.error(`Batch attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount <= maxRetries) {
              currentBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
              setBatchStatus(`Retrying with smaller batch size (${currentBatchSize})...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            } else {
              toast.error(`Failed to process batch with ${currentModelId.split('/').pop()}. Continuing...`);
              break; // Give up on this specific batch iteration, move to next
            }
          }
        }
        
        // Only increment batchIndex if we successfully generated prompts OR if we exhausted retries
        // If we broke out early due to quota, we want to retry the SAME batch index with the NEXT model
        if (batchSuccess || retryCount > maxRetries) {
          batchIndex++;
        }
      }
      
      if (!abortControllerRef.current?.signal.aborted) {
        toast.success(`${accumulatedPrompts.length} Masterpiece Prompts berhasil dibuat!`);
      }
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        toast.error('Error 429 (Quota Exceeded): Your API Key quota is exhausted. Please check billing in Google AI Studio.');
      } else {
        toast.error('Failed to generate prompt. Check your API Key.');
        console.error(error);
      }
    } finally {
      setIsBatching(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const downloadTXT = () => {
    if (generatedPrompts.length === 0) return;
    
    const txtContent = generatedPrompts
      .map(p => {
        const pos = p.positivePrompt.replace(/\n/g, ' ').trim();
        const neg = p.negativePrompt ? p.negativePrompt.replace(/\n/g, ' ').trim() : '';
        return neg ? `${pos} ${neg}` : pos;
      })
      .join('\n\n');

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `StockMaster_Prompts_${keyword.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('TXT file downloaded successfully!');
  };

  const copyAllPrompts = () => {
    const textToCopy = generatedPrompts
      .map(p => {
        const pos = p.positivePrompt.replace(/\n/g, ' ').trim();
        const neg = p.negativePrompt ? p.negativePrompt.replace(/\n/g, ' ').trim() : '';
        return neg ? `${pos} ${neg}` : pos;
      })
      .join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    toast.success('All prompts copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6 sticky top-8">
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
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Camera Motion</Label>
                  <Select value={cameraMotion} onValueChange={(val) => val && setCameraMotion(val)}>
                    <SelectTrigger className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">
                      {CAMERA_MOTION.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-semibold leading-tight font-mono">Lens Flare</Label>
                  <Select value={lensFlare} onValueChange={(val) => val && setLensFlare(val)}>
                    <SelectTrigger className="h-10 bg-[#050505] border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/30 hover:border-cyan-400/50 transition-colors font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#050505] border-cyan-500/50 text-cyan-300 font-mono">
                      {LENS_FLARE.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
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
                <p className="text-[10px] text-cyan-500/70 leading-tight font-mono">
                  {creativity < 50 ? 'Konservatif: Variasi rendah, sangat patuh pada prompt dasar.' : 
                   creativity <= 100 ? 'Seimbang: Eksplorasi konsep baru dengan tetap menjaga relevansi.' : 
                   'Ekstrem: Variasi liar, ide out-of-the-box, risiko halusinasi lebih tinggi.'}
                </p>
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
      </div>

      <div className="lg:col-span-8">
        <Card className="h-full flex flex-col bg-[#0a0a0a] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-cyan-300 font-mono">Batch Generation Interface {generatedPrompts.length > 0 && <span className="text-xs bg-emerald-950/30 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]"><Save className="w-3 h-3" /> Auto-Saved</span>}</CardTitle>
              <CardDescription className="text-cyan-500/70 text-xs mt-1 font-mono">Hasil produksi prompt masal siap ekspor.</CardDescription>
            </div>
            {generatedPrompts.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setGeneratedPrompts([]); localStorage.removeItem('stockmaster_prompts'); toast.success('Data dibersihkan'); }} className="text-red-400 border-red-500/50 hover:text-red-300 hover:bg-red-950/50 font-mono">Clear</Button>
                <Button variant="outline" size="sm" onClick={downloadTXT} className="text-cyan-300 border-cyan-500/50 hover:bg-cyan-950/50 font-mono"><Download className="w-4 h-4 mr-2" /> Download TXT ({generatedPrompts.length})</Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {generatedPrompts.length === 0 && !isBatching ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-cyan-500/50 border-2 border-dashed border-cyan-500/30 rounded-lg bg-[#050505]">
                <Palette className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
                <p className="text-sm font-mono">Belum ada prompt yang dihasilkan.</p>
                <p className="text-xs opacity-50 mt-2 font-mono">Mulai Auto-Batching untuk memproduksi masal.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-[#050505] border border-cyan-500/30 rounded-lg text-center shadow-[inset_0_0_15px_rgba(6,182,212,0.05)]">
                  <h3 className="text-cyan-300 text-lg font-medium mb-1 font-mono">Auto-Batching Status</h3>
                  <p className="text-[10px] text-fuchsia-400 font-mono mb-3 animate-pulse">Active Model: {activeModel || selectedModel}</p>
                  <div className="w-full bg-cyan-950/30 rounded-full h-4 mb-3 border border-cyan-500/50 overflow-hidden">
                    <div className="bg-fuchsia-500 h-4 transition-all duration-500 relative shadow-[0_0_10px_rgba(217,70,239,0.8)]" style={{ width: `${Math.min(100, (currentCount / targetCount) * 100)}%` }}>
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  <p className="text-cyan-400 text-sm font-mono">{currentCount} / {targetCount} Prompts Generated</p>
                </div>

                {marketIntel.length > 0 && (
                  <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg">
                    <h4 className="text-cyan-300 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                      <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-500" /> Market Intelligence Report
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {marketIntel?.map((intel, idx) => (
                        <div key={idx} className="text-[10px] text-cyan-400/80 bg-[#050505] p-2 rounded border border-cyan-500/10 font-mono leading-tight">
                          <span className="text-fuchsia-500 font-bold mr-1">#{idx + 1}</span> {intel}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedPrompts.length > 0 ? (
                  <div>
                    <h4 className="text-cyan-300 font-medium mb-4 flex items-center gap-2 border-b border-cyan-500/30 pb-2 font-mono"><Eye className="w-4 h-4 text-fuchsia-500" /> Preview (Prompt Terakhir)</h4>
                    
                    {/* Render ONLY the last prompt to save DOM memory */}
                    <div className="p-4 rounded-lg border border-cyan-500/30 bg-[#050505] hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-cyan-950/80 text-cyan-300 text-[10px] px-2 py-1 rounded-bl-lg border-b border-l border-cyan-500/50 font-mono font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                        PROMPT #{generatedPrompts.length}
                      </div>
                      <div className="space-y-4 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Positive Prompt</Label>
                          <div className="relative">
                            <p className="text-sm text-cyan-50 leading-relaxed bg-[#0a0a0a] p-3 rounded border border-cyan-500/30">{generatedPrompts[generatedPrompts.length - 1].positivePrompt}</p>
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-950/50" onClick={() => { navigator.clipboard.writeText(generatedPrompts[generatedPrompts.length - 1].positivePrompt); toast.success('Prompt disalin!'); }}><Copy className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        {generatedPrompts[generatedPrompts.length - 1].negativePrompt && (
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-fuchsia-500/70 font-mono">Negative Prompt (Quality Guard)</Label>
                            <div className="relative">
                              <p className="text-sm text-fuchsia-50/80 leading-relaxed bg-[#0a0a0a] p-3 rounded border border-fuchsia-500/30">{generatedPrompts[generatedPrompts.length - 1].negativePrompt}</p>
                              <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 text-fuchsia-500 hover:text-fuchsia-300 hover:bg-fuchsia-950/50" onClick={() => { navigator.clipboard.writeText(generatedPrompts[generatedPrompts.length - 1].negativePrompt!); toast.success('Negative Prompt disalin!'); }}><Copy className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-center text-cyan-500/70 text-xs mt-6 bg-[#050505] p-3 rounded-lg border border-cyan-500/30 font-mono">
                      <Sparkles className="w-3 h-3 inline-block mr-1 text-fuchsia-500" />
                      Hanya menampilkan 1 prompt terakhir untuk menghemat memori browser. <br/>
                      Silakan klik <strong className="text-cyan-300">Download TXT</strong> untuk melihat dan menyimpan seluruh {generatedPrompts.length} prompt.
                    </p>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-cyan-500/50 border-2 border-dashed border-cyan-500/30 rounded-lg bg-[#050505] animate-pulse">
                    <Loader2 className="w-10 h-10 mb-4 text-fuchsia-500 animate-spin drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                    <p className="text-sm text-cyan-400 font-mono">Memproses Batch Pertama...</p>
                    <p className="text-xs opacity-50 mt-2 font-mono">AI sedang merakit masterpiece Anda.</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
