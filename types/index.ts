export interface GroundingSource { 
  title: string; 
  uri: string; 
}

export interface SubNiche { 
  name: string; 
  reason: string; 
}

export interface GeneratedPrompt { 
  positivePrompt: string; 
  negativePrompt: string; 
  aspectRatio: string; 
}

export interface ResearchResult {
  trendScore: number; 
  saturationIndex: number; 
  demandLevel: string; 
  competitionLevel: string;
  buyerPersona: string; 
  colorPalette: string[]; 
  analysis: string; 
  subNiches: SubNiche[];
  visualRequirements: string[]; 
  seoTags: string[]; 
  seasonality: string; 
  rejectionRisks: string[];
  titleTemplate: string; 
  sources?: GroundingSource[];
}

export interface VisionResult {
  commercialDeconstruction: string;
  technicalExtraction: { 
    lighting: string; 
    lens: string; 
    colorGrading: string; 
  };
  reverseEngineeredPrompt: GeneratedPrompt;
}

export const CATEGORIES = [
  { id: 'commercial-photo', name: 'Commercial Photo' },
  { id: 'clean-vector', name: 'Clean Vector' },
  { id: 'minimalist-background', name: 'Minimalist Background' },
  { id: '3d-render', name: '3D Render' },
  { id: 'cinematic-video', name: 'Cinematic Video' },
];

export const LIGHTING_STYLES = ['Auto/AI Choice', 'Cinematic Lighting', 'Studio Softbox', 'Natural Sunlight', 'Neon Cyberpunk', 'Chiaroscuro (High Contrast)'];
export const CAMERA_ANGLES = ['Auto/AI Choice', 'Macro (Close-up)', 'Wide Angle', 'Aerial/Drone View', 'Eye-Level', 'Low Angle (Heroic)'];
export const COLOR_TONES = ['Auto/AI Choice', 'Warm & Earthy', 'Cool & Moody', 'Pastel Minimalist', 'Vibrant & Saturated', 'Monochrome/B&W'];
export const ASPECT_RATIOS = ['Auto/AI Choice', '16:9', '9:16', '1:1', '3:2', '4:3', '21:9'];
export const COMPOSITIONS = ['Auto/AI Choice', 'Rule of Thirds', 'Symmetrical Balance', 'Leading Lines', 'Golden Ratio', 'Negative Space (Copy Space)', 'Framing within Frame'];
