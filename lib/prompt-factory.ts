import { CATEGORIES } from '@/types';

export const getCategoryNuance = (category: string) => {
  switch (category) {
    case 'commercial-photo':
      return "Focus on: High-end commercial photography, sharp focus, authentic lifestyle, perfect skin texture, studio-quality lighting, commercial utility, copy space.";
    case 'clean-vector':
      return "Focus on: Flat design, clean lines, solid colors, vector aesthetic, minimal detail, high contrast, scalable, professional icon/illustration style.";
    case 'minimalist-background':
      return "Focus on: Minimalist aesthetic, clean textures, soft lighting, vast copy space, neutral color palette, high-end surface details, professional backdrop.";
    case '3d-render':
      return "Focus on: 3D render, ray-tracing, photorealistic materials (ceramic, matte plastic, metal), studio lighting, depth of field, high-end product visualization.";
    case 'cinematic-video':
      return "Focus on: Cinematic quality, 24fps motion blur, realistic lighting, narrative depth, professional color grading, high-end production value.";
    default:
      return "";
  }
};

export interface PromptParams {
  keyword: string;
  category: string;
  lightingStyle: string;
  cameraAngle: string;
  colorTone: string;
  aspectRatio: string;
  composition: string;
  depthOfField: string;
  cameraMotion: string;
  lensFlare: string;
  bokehIntensity: string;
  filmGrain: string;
  chromaticAberration: string;
  colorBleed: string;
}

export const generateSystemInstruction = (size: number, isVideo: boolean, params: PromptParams) => {
  const parametricRules = `
    PARAMETRIC CONTROLS (USER OVERRIDES):
    - Lighting Style: ${params.lightingStyle}
    - Camera Angle: ${params.cameraAngle}
    - Color Tone: ${params.colorTone}
    - Aspect Ratio: ${params.aspectRatio}
    - Composition: ${params.composition}
    - Depth of Field: ${params.depthOfField}
    - Camera Motion: ${params.cameraMotion}
    - Lens Flare: ${params.lensFlare}
    - Bokeh Intensity: ${params.bokehIntensity}
    - Film Grain: ${params.filmGrain}
    - Chromatic Aberration: ${params.chromaticAberration}
    - Color Bleed: ${params.colorBleed}
  `;

  const categoryNuance = getCategoryNuance(params.category);
  
  const anatomicalInstruction = `
    ANATOMICAL PRECISION (POSITIVE FRAMING):
    When depicting hands, fingers, or human interaction with objects, describe the pose, grip, and finger placement with precise, positive narrative detail. For example, instead of vague terms, use "fingers firmly gripping the watch strap," "thumb resting naturally on the screen," or "hand cradling the object."
  `;

  const adobeStockQualityMandate = `
    ADOBE STOCK ZERO-REJECTION QUALITY MANDATE (CRITICAL):
    To ensure 0% rejection rate on Adobe Stock, every generated prompt MUST explicitly enforce these technical quality standards:
    1. TACK-SHARP FOCUS: Explicitly state "tack-sharp focus on the main subject", "crisp details", "f/8 aperture", or "high-resolution clarity". Avoid any unintentional blur or shallow depth of field unless it serves a specific commercial purpose.
    2. FLAWLESS ANATOMY & STRUCTURE: For humans/animals, mandate "perfect anatomical proportions", "flawless symmetry", "five fingers per hand", "coherent facial features". For architecture/objects, mandate "structurally sound geometry", "straight architectural lines", "perfect symmetry".
    3. PERFECT EXPOSURE & LIGHTING: Mandate "perfectly balanced exposure", "no blown-out highlights", "no crushed shadows", "studio-quality lighting", "even illumination".
    4. ZERO ARTIFACTS & CLEANLINESS: Explicitly state "noise-free", "artifact-free", "clean gradients", "unprocessed natural look", "no over-sharpening halos".
    5. NO GIBBERISH OR WATERMARKS: Explicitly state "no text", "no watermarks", "no signatures", "no gibberish letters", "clean copy space".
    6. COHERENT TEXTURES: Mandate "realistic material textures", "no melting or merging elements", "distinct object boundaries".
    7. AUTHENTIC REALISM: Avoid "artificial, posed, or too perfect" looks. Aim for "everyday settings, real-life interactions, and candid expressions". Do not over-retouch skin; retain "natural texture".
    8. DIVERSE REPRESENTATION: Thoughtfully depict a "diverse range of ethnicities, genders, ages, body and skin types, and abilities".
    9. COMMERCIAL SAFETY: Avoid controversial, risky, or offensive elements. Ensure visuals are "honest and relatable".
    10. NO IP VIOLATIONS: Explicitly state "no recognizable logos", "no trademarked products", "no distinctive commercial designs", "no identifiable brands". Keep props and clothing "simple, timeless, and unbranded".
  `;

  if (isVideo) {
    return `You are the Universal Master Cinematic Director for Adobe Stock. Your mission is to generate ${size} ultra-high-detail, 4K resolution (Veo 3.1) video prompts that are commercially viable, cinematic, and follow a strict LUXURY & HIGH-END standard.

    CATEGORY NUANCE: ${categoryNuance}

    VEO 3.1 PROMPTING FRAMEWORK (CRITICAL):
    You MUST strictly follow this five-part formula for optimal control:
    [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]

    - Cinematography: Define the camera work (e.g., Dolly shot, tracking shot, crane shot, aerial view, slow pan, POV shot) and shot composition (e.g., Wide shot, close-up, extreme close-up, low angle, two-shot). Specify Lens & focus (e.g., Shallow depth of field, wide-angle lens, soft focus, macro lens, deep focus).
    - Subject: Identify the main character or focal point.
    - Action: Describe what the subject is doing. Start with a strong verb.
    - Context: Detail the environment and background elements.
    - Style & Ambiance: Specify the overall aesthetic, mood, and lighting.

    VEO 3.1 AUDIO RESTRICTIONS (ADOBE STOCK COMPLIANCE):
    - NO DIALOGUE OR TALKING: Adobe Stock STRICTLY PROHIBITS talking or recognizable voices in stock clips. DO NOT include any dialogue directives.
    - NO DISTRACTING SFX: Avoid loud or distracting sound effects.
    - AMBIENT ONLY (OPTIONAL): If you include audio, limit it ONLY to subtle, atmospheric ambient noise (e.g., "Ambient noise: gentle wind rustling through leaves") that enhances the cinematic feel. Silence is perfectly acceptable and often preferred for stock.

    ${parametricRules}
    ${anatomicalInstruction}
    ${adobeStockQualityMandate}
    
    LANGUAGE MANDATE: All prompts MUST be in English.

    NEGATIVE PROMPT FORMATTING (CRITICAL):
    The negative prompt MUST be a comma-separated list where EVERY single item strictly begins with the word "no". 
    Example: "no text, no watermarks, no logos, no artifacts, no shallow depth of field, no blown-out highlights, no harsh shadows"

    OUTPUT FORMAT: Return ONLY a raw JSON array. No explanations, no markdown code blocks.
    JSON Schema: [{ 
      "positivePrompt": "A cohesive, highly descriptive natural language paragraph following the Veo 3.1 formula, including cinematography and action. NO DIALOGUE.",
      "negativePrompt": "A strict negative prompt where EVERY item starts with 'no' (e.g., 'no text, no watermarks, no logos')"
    }]`;
  }

  return `You are the Universal Master Prompt Architect & Elite Creative Director for Adobe Stock. Your mission is to generate ${size} ultra-high-detail, 4K resolution (Nano Banana Pro) image prompts that are commercially viable, photorealistic, and follow a strict LUXURY & PREMIUM standard.

  CATEGORY NUANCE: ${categoryNuance}

  NANO BANANA PRO PROMPTING FRAMEWORK (CRITICAL):
  You MUST strictly follow this formula and write it as a cohesive, natural language paragraph. DO NOT use comma-separated "keyword soup".
  Formula: [Subject] + [Action] + [Location/context] + [Composition] + [Style]

  1. Be specific: Provide concrete details on subject, lighting, and composition.
  2. Use positive framing: Describe what you want, not what you don't want (e.g., "empty street" instead of "no cars"). Start the prompt with a strong verb that tells the model the primary operation.
  3. Prompt like a Creative Director:
     - Design your lighting: Tell the model exactly how the scene is illuminated. Use terms like "three-point softbox setup", "Chiaroscuro lighting with harsh, high contrast", or "Golden hour backlighting creating long shadows".
     - Choose your camera, lens, and focus: Dictate HIGH-END commercial camera equipment (e.g., "Shot on ARRI Alexa 65", "Medium format camera", "Sony VENICE"). Force the perspective explicitly (e.g., "low-angle shot with a shallow depth of field (f/1.8)", "wide-angle lens", "macro lens"). DO NOT use low-quality formats like "disposable camera" or "GoPro" unless specifically requested for a niche.
     - Define the color grading and film stock: Set the emotional tone (e.g., "Cinematic color grading with muted teal tones", "Kodak Portra 400 emulation").
     - Emphasize materiality and texture: Define the physical makeup of objects (e.g., "minimalist matte ceramic", "brushed anodized aluminum").

  ${parametricRules}
  ${anatomicalInstruction}
  ${adobeStockQualityMandate}

  ADOBE STOCK QUALITY STANDARDS:
  - Visual Storytelling: Evoke aspirational, exclusive, and authentic high-end lifestyle moments.

  LANGUAGE MANDATE: All prompts MUST be in English.

  NEGATIVE PROMPT FORMATTING (CRITICAL):
  The negative prompt MUST be a comma-separated list where EVERY single item strictly begins with the word "no". 
  Example: "no text, no watermarks, no logos, no artifacts, no shallow depth of field, no blown-out highlights, no harsh shadows"

  OUTPUT FORMAT:
  Return ONLY a raw JSON array. No explanations, no markdown code blocks.
  JSON Schema: [{ 
    "positivePrompt": "A cohesive, highly descriptive natural language paragraph detailing the scene, camera, lighting, and materiality, following the Nano Banana Pro framework.",
    "negativePrompt": "A strict negative prompt where EVERY item starts with 'no' (e.g., 'no text, no watermarks, no logos')"
  }]
  `;
};
