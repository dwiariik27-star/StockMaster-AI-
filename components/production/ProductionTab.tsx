import { useState, useEffect, useRef } from 'react';
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
  callAI: (options: any) => Promise<{ text: string }>;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedIntel = localStorage.getItem('stockmaster_market_intel');
    if (savedIntel) setMarketIntel(JSON.parse(savedIntel));
  }, []);

  useEffect(() => {
    if (marketIntel.length > 0) localStorage.setItem('stockmaster_market_intel', JSON.stringify(marketIntel));
  }, [marketIntel]);

  useEffect(() => {
    const savedPrompts = localStorage.getItem('stockmaster_prompts');
    if (savedPrompts) setGeneratedPrompts(JSON.parse(savedPrompts));
  }, [setGeneratedPrompts]);

  useEffect(() => {
    if (generatedPrompts.length > 0) localStorage.setItem('stockmaster_prompts', JSON.stringify(generatedPrompts));
  }, [generatedPrompts]);

  const handleGenerate = async () => {
    if (!keyword.trim()) { toast.error('Silakan masukkan kata kunci tren.'); return; }
    if (targetCount < 10 || targetCount > 1000) { toast.error('Target prompt harus antara 10 - 1000.'); return; }
    
    setIsBatching(true);
    setCurrentCount(0);
    setGeneratedPrompts([]);
    setMarketIntel([]);
    setBatchStatus('Melakukan Intelijen Pasar & Analisis Niche...');
    
    abortControllerRef.current = new AbortController();
    let accumulatedPrompts: GeneratedPrompt[] = [];

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
            console.error("Gagal parse market intel JSON:", parseError, "Original text:", intelText);
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
        console.error("Gagal generate market intel, menggunakan fallback.", e);
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

      const getSystemInstruction = (size: number) => {
        const parametricRules = `
          PARAMETRIC CONTROLS (USER OVERRIDES):
          - Lighting Style: ${lightingStyle}
          - Camera Angle: ${cameraAngle}
          - Color Tone: ${colorTone}
          - Aspect Ratio: ${aspectRatio}
          - Composition: ${composition}
          - Depth of Field: ${depthOfField}
          - Camera Motion: ${cameraMotion}
          - Lens Flare: ${lensFlare}
          - Bokeh Intensity: ${bokehIntensity}
          - Film Grain: ${filmGrain}
          - Chromatic Aberration: ${chromaticAberration}
          - Color Bleed: ${colorBleed}
        `;

        let base = `Anda adalah Elite Creative Director dan Prompt Engineer ahli untuk Adobe Stock. Tugas Anda adalah menghasilkan ${size} prompt gambar 4K (Nano Banana Pro) yang sangat presisi, fotorealistik, dan bernilai komersial tinggi dengan standar LUXURY & PREMIUM.

Setiap prompt WAJIB mematuhi kerangka kerja "Creative Director" dari Nano Banana: [Subject] + [Action] + [Storytelling Context] + [Composition & DoF] + [Lighting & Style] + [Optical & Film Emulation] + [Commercial Utility].

ATURAN WAJIB ADOBE STOCK LUXURY STANDARDS:
1. Visual Storytelling: Gambar harus membangkitkan emosi aspirasional, mewah, dan eksklusif. Fokus pada momen "high-end lifestyle" yang autentik.
2. Detail Mikroskopis: Deskripsikan tekstur dengan sangat mendalam. Gunakan istilah seperti "micro-textures", "pore-level detail", "fine fabric weave", "intricate craftsmanship".
3. Materialitas Mewah: Integrasikan material premium: "polished Carrara marble", "brushed champagne gold", "supple Italian leather", "raw Thai silk", "hand-blown crystal", "sustainably sourced exotic wood".
4. Pencahayaan High-End: Gunakan setup pencahayaan yang canggih: "Rembrandt lighting with soft fill", "Global illumination with subtle bounce", "Studio butterfly lighting", "Natural light through large floor-to-ceiling windows with soft diffusion".
5. Kontrol Kamera & Lensa (Medium Format Look): Simulasikan kualitas kamera Medium Format (Hasselblad/Phase One). Gunakan "80mm f/1.9 medium format lens", "extremely high dynamic range", "natural color science", "smooth tonal transitions".
6. Komposisi & Copy Space: Pastikan komposisi sangat seimbang (Rule of Thirds, Golden Ratio) dengan "intentional copy space" untuk penempatan teks iklan premium.
7. Color Palette Sophisticated: Gunakan palet warna yang elegan: "muted earth tones", "monochromatic luxury", "deep jewel tones (emerald, sapphire, ruby)", "minimalist neutral palette (beige, taupe, charcoal)".
8. Optical & Film Emulation: Gunakan efek optik yang halus dan mahal: "subtle anamorphic lens flare", "creamy circular bokeh", "fine-grained film stock (Kodak Portra 160)", "natural halation on highlights".
9. Tipografi & Integritas Teks: Jika ada teks, gunakan font serif elegan atau sans-serif modern yang bersih. Teks harus terlihat seperti bagian dari desain produk mewah yang nyata.
10. Commercial Utility: Targetkan pasar "Luxury Real Estate", "High-End Tech", "Premium Wellness", "Gourmet Culinary", dan "Elite Corporate".

WAJIB: Output harus berupa JSON array murni. Jangan tambahkan teks penjelasan, pembukaan, atau penutup. Jangan gunakan blok kode markdown (seperti \`\`\`json). Langsung berikan array JSON.

ATURAN NEGATIVE PROMPT (DEEP HALLUCINATION ANALYSIS - BIAS: ${negativePromptBias}%):
1. Base Rejections (MANDATORY): "watermark, text, signature, logo, trademark, copyright, blurry, cropped, out of focus, low quality, jpeg artifacts, noise, pixelated, ai generated, generic, distorted face, extra limbs, fused fingers".
2. Deep Contextual Analysis (CRITICAL): Analisis subjek pada Positive Prompt secara mikroskopis. Gunakan intensitas ${negativePromptBias}% untuk menghasilkan kata kunci negatif yang sangat spesifik guna mencegah halusinasi AI yang unik untuk subjek tersebut.
3. BIAS SCALING: Semakin tinggi bias (${negativePromptBias}%), semakin panjang dan teknis daftar negatif yang dihasilkan.
4. SYNTHESIS MANDATE: Gabungkan semua menjadi satu string "negativePrompt" yang komprehensif.

INTELIJEN KOMERSIAL & SEO:
1. Commercial Score: Berikan skor 0-100 berdasarkan potensi penjualan di Adobe Stock (Utility, Trend, Quality).
2. Keyword Expansion: Berikan 50 kata kunci SEO yang paling relevan dan memiliki volume pencarian tinggi untuk gambar tersebut.
3. Color Palette: Berikan 5 kode warna HEX yang paling harmonis dan mendukung mood visual prompt tersebut.

Output harus dalam format JSON array of objects:
{
  "positivePrompt": string,
  "negativePrompt": string,
  "aspectRatio": string,
  "commercialScore": number,
  "keywords": string[],
  "colorPalette": string[]
}

${parametricRules}
Jika kategori adalah 'Minimalist Background', fokus pada Copy Space (60-70% area kosong) dengan tekstur mewah (misal: fine linen, polished stone).
Jika kategori adalah '3D Render', fokus pada Materialitas (matte gold, frosted glass, liquid metal).
Jika kategori adalah 'Clean Vector', fokus pada minimalisme elegan, garis tipis presisi, palet warna premium.
PENTING: Jika Anda adalah model penalaran (seperti DeepSeek R1), harap berikan proses berpikir yang sangat singkat dan langsung ke inti agar tidak melebihi batas token output. Fokuskan token Anda pada kualitas prompt JSON.`;

        if (category === 'cinematic-video') {
          base = `Anda adalah Elite Cinematic Director untuk Adobe Stock. Tugas Anda adalah menghasilkan ${size} prompt video sinematik (Veo 3.1) yang sangat presisi dan bernilai komersial tinggi dengan estetika LUXURY & HIGH-END.

Setiap prompt WAJIB mematuhi formula Veo 3.1: [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance] + [Audio Orchestration].

ATURAN WAJIB VEO 3.1 LUXURY STANDARDS:
1. Cinematography (High-End Motion): Gunakan pergerakan kamera yang sangat halus dan terencana: "Slow-motion tracking shot at 120fps", "Elegant crane shot descending", "Smooth gimbal-stabilized follow shot", "Cinematic rack focus between high-end objects".
2. Subject & Action: Subjek harus memancarkan keanggunan, profesionalisme, atau kemewahan. Aksi harus terlihat natural namun berkelas.
3. Context: Lingkungan harus terlihat mahal dan terkurasi: "modern architectural masterpiece", "private jet interior", "luxury spa sanctuary", "high-end boutique atelier".
4. Style & Ambiance: Gunakan pencahayaan sinematik yang kaya: "Golden hour glow with anamorphic flares", "Moody noir lighting with deep shadows and soft highlights", "Bright, airy high-key commercial aesthetic".
5. Directing the Soundstage (Audio): Sertakan instruksi audio yang premium:
   - Dialogue: Suara yang tenang, berwibawa, atau ramah.
   - Sound Effects (SFX): Suara detail yang memuaskan (ASMR-like): "the soft click of a luxury watch", "the pouring of expensive champagne", "the gentle rustle of silk".
   - Ambient noise: Soundscape yang tenang dan terkurasi.
Sertakan orkestrasi soundstage dan durasi klip spesifik (4, 6, atau 8 detik).

INTELIJEN KOMERSIAL & SEO:
1. Commercial Score: Berikan skor 0-100 berdasarkan potensi penjualan di Adobe Stock (Utility, Trend, Quality).
2. Keyword Expansion: Berikan 50 kata kunci SEO yang paling relevan dan memiliki volume pencarian tinggi untuk video tersebut.
3. Color Palette: Berikan 5 kode warna HEX yang paling harmonis dan mendukung mood visual prompt tersebut.

Output harus dalam format JSON array of objects:
{
  "positivePrompt": string,
  "negativePrompt": string,
  "aspectRatio": string,
  "commercialScore": number,
  "keywords": string[],
  "colorPalette": string[]
}

${parametricRules}`;
        }
        return base;
      };

      let batchIndex = 0;
      while (accumulatedPrompts.length < targetCount) {
        if (abortControllerRef.current?.signal.aborted) {
          toast.info('Auto-Batching dihentikan oleh pengguna.');
          break;
        }

        const remaining = targetCount - accumulatedPrompts.length;
        let currentBatchSize = Math.min(5, remaining);
        
        setBatchStatus(`Generating batch... (${accumulatedPrompts.length}/${targetCount})`);
        
        const baseTemp = creativity / 100;
        const currentTemp = Math.min(baseTemp + (batchIndex / Math.max(1, Math.ceil(targetCount / 5))) * 0.4, 2.0);
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
              prompt: `Hasilkan ${currentBatchSize} prompt untuk kategori "${CATEGORIES.find(c => c.id === category)?.name}" dengan kata kunci: "${keyword}".`,
              system: getSystemInstruction(currentBatchSize) + dynamicInstruction,
              temperature: currentTemp,
              jsonMode: true,
              maxTokens: selectedProvider === 'groq' ? 4000 : 12000
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
            console.error(`Batch attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount <= maxRetries) {
              currentBatchSize = Math.max(1, Math.floor(currentBatchSize / 2));
              setBatchStatus(`Retrying with smaller batch size (${currentBatchSize})...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            } else {
              toast.error(`Gagal memproses batch. Melanjutkan ke batch berikutnya...`);
              batchSuccess = true; 
            }
          }
        }
        batchIndex++;
      }
      
      if (!abortControllerRef.current?.signal.aborted) {
        toast.success(`${accumulatedPrompts.length} Masterpiece Prompts berhasil dibuat!`);
      }
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        toast.error('Error 429 (Quota Exceeded): Kuota API Key Anda habis. Silakan periksa billing di Google AI Studio.');
      } else {
        toast.error('Gagal menghasilkan prompt. Cek API Key Anda.');
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
      .map(p => `${p.positivePrompt} --ar ${p.aspectRatio} --no ${p.negativePrompt}`)
      .join('\n\n');

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `StockMaster_Prompts_${keyword.replace(/\\s+/g, '_')}.txt`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('File TXT berhasil diunduh!');
  };

  const copyAllPrompts = () => {
    const textToCopy = generatedPrompts
      .map(p => `${p.positivePrompt} --ar ${p.aspectRatio} --no ${p.negativePrompt}`)
      .join('\n\n');
    navigator.clipboard.writeText(textToCopy);
    toast.success('Semua prompt disalin ke clipboard!');
  };

  const downloadCSV = () => {
    if (generatedPrompts.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Filename,Category,Keyword,Positive Prompt,Negative Prompt,Aspect Ratio,Commercial Score,Keywords\n";
    
    const categoryName = CATEGORIES.find(c => c.id === category)?.name || category;
    
    generatedPrompts.forEach((p, index) => {
      const filename = `image_${index + 1}.jpg`;
      const cat = `"${categoryName.replace(/"/g, '""')}"`;
      const kw = `"${keyword.replace(/"/g, '""')}"`;
      const positive = `"${(p.positivePrompt || '').replace(/"/g, '""')}"`;
      const negative = `"${(p.negativePrompt || '').replace(/"/g, '""')}"`;
      const ar = `"${(p.aspectRatio || '').replace(/"/g, '""')}"`;
      const score = p.commercialScore || 0;
      const keywordsList = `"${(p.keywords || []).join(', ').replace(/"/g, '""')}"`;
      
      csvContent += `${filename},${cat},${kw},${positive},${negative},${ar},${score},${keywordsList}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StockMaster_Prompts_${keyword.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh!');
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
                <div className="space-y-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={negativePromptBias} 
                    onChange={(e) => setNegativePromptBias(Number(e.target.value))}
                    className="w-full h-1.5 bg-cyan-950/50 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                  />
                  <div className="flex justify-between text-[8px] text-cyan-700 font-mono px-0.5">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-[10px] text-cyan-500/70 leading-tight font-mono">
                  {negativePromptBias < 30 ? 'Minimal: Hanya penolakan dasar (watermark, dll).' : 
                   negativePromptBias <= 70 ? 'Optimal: Analisis halusinasi standar untuk subjek.' : 
                   'Agresif: Analisis kegagalan teknis mendalam & istilah render error.'}
                </p>
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
                <Button variant="default" size="sm" className="bg-fuchsia-600 text-white hover:bg-fuchsia-500 font-bold font-mono shadow-[0_0_10px_rgba(217,70,239,0.4)]" onClick={downloadCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
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
                  <h3 className="text-cyan-300 text-lg font-medium mb-3 font-mono">Auto-Batching Status</h3>
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
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Aspect Ratio</Label>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyan-950/30 border border-cyan-500/40 rounded text-xs font-medium text-cyan-300 font-mono shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                              <Box className="w-3 h-3 text-fuchsia-500" /> {generatedPrompts[generatedPrompts.length - 1].aspectRatio}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Commercial Score</Label>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-fuchsia-950/30 border border-fuchsia-500/40 rounded text-xs font-bold text-fuchsia-400 font-mono shadow-[0_0_8px_rgba(217,70,239,0.2)]">
                              <Target className="w-3 h-3" /> {generatedPrompts[generatedPrompts.length - 1].commercialScore}%
                            </div>
                          </div>
                          {(generatedPrompts[generatedPrompts.length - 1].positivePrompt.toLowerCase().includes('copy space') || 
                            generatedPrompts[generatedPrompts.length - 1].positivePrompt.toLowerCase().includes('minimalist')) && (
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-mono">Utility Badge</Label>
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-950/30 border border-emerald-500/40 rounded text-[10px] font-bold text-emerald-400 font-mono shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                <Sparkles className="w-3 h-3" /> HIGH UTILITY
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Positive Prompt</Label>
                          <div className="relative">
                            <p className="text-sm text-cyan-50 leading-relaxed bg-[#0a0a0a] p-3 rounded border border-cyan-500/30">{generatedPrompts[generatedPrompts.length - 1].positivePrompt}</p>
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-950/50" onClick={() => { navigator.clipboard.writeText(generatedPrompts[generatedPrompts.length - 1].positivePrompt); toast.success('Prompt disalin!'); }}><Copy className="w-3 h-3" /></Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-fuchsia-400 flex items-center gap-1 font-mono"><ShieldAlert className="w-3 h-3" /> Negative Prompt (Avoid)</Label>
                          <p className="text-xs text-fuchsia-200/80 leading-relaxed bg-fuchsia-950/10 p-3 rounded border border-fuchsia-500/20">{generatedPrompts[generatedPrompts.length - 1].negativePrompt}</p>
                        </div>

                        {generatedPrompts[generatedPrompts.length - 1].keywords && (
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">SEO Keywords (Top 50)</Label>
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-[#050505] rounded border border-cyan-500/10 custom-scrollbar">
                              {generatedPrompts[generatedPrompts.length - 1].keywords?.map((kw, idx) => (
                                <span key={idx} className="text-[9px] bg-cyan-950/30 text-cyan-500/70 px-1.5 py-0.5 rounded border border-cyan-500/10 font-mono">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {generatedPrompts[generatedPrompts.length - 1].colorPalette && (
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-cyan-500/70 font-mono">Color Palette Suggester</Label>
                            <div className="flex gap-2 p-2 bg-[#050505] rounded border border-cyan-500/10">
                              {generatedPrompts[generatedPrompts.length - 1].colorPalette?.map((color, idx) => (
                                <div 
                                  key={idx} 
                                  className="w-8 h-8 rounded border border-white/10 shadow-sm transition-transform hover:scale-110 cursor-pointer" 
                                  style={{ backgroundColor: color }}
                                  title={color}
                                  onClick={() => { navigator.clipboard.writeText(color); toast.success(`HEX ${color} disalin!`); }}
                                />
                              ))}
                              <div className="flex flex-col justify-center ml-2">
                                <span className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-widest">Visual Harmony</span>
                                <span className="text-[8px] text-cyan-500/40 font-mono">Click to copy HEX</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-center text-cyan-500/70 text-xs mt-6 bg-[#050505] p-3 rounded-lg border border-cyan-500/30 font-mono">
                      <Sparkles className="w-3 h-3 inline-block mr-1 text-fuchsia-500" />
                      Hanya menampilkan 1 prompt terakhir untuk menghemat memori browser. <br/>
                      Silakan klik <strong className="text-cyan-300">Download TXT</strong> atau <strong className="text-cyan-300">Export CSV</strong> untuk melihat dan menyimpan seluruh {generatedPrompts.length} prompt.
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
