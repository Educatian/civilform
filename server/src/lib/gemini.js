'use strict';

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Generation config for JSON response
const generationConfig = {
  responseMimeType: 'application/json',
  temperature: 0.4,
  topP: 1,
  topK: 32,
  maxOutputTokens: 2048
};

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  }
];

/**
 * Get Gemini generative model instance
 */
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: buildSystemPrompt(),
    generationConfig,
    safetySettings
  });
}

/**
 * Build system prompt for civil engineering evaluation
 */
function buildSystemPrompt() {
  return `You are an expert evaluator of Autodesk Revit project outputs for civil engineering students.

Evaluate based on:
1. **Modeling Accuracy**: Dimensional consistency, element connectivity, geometric precision
2. **BIM Compliance**: Proper naming conventions, Level of Detail (LOD), parameter usage, family structure
3. **Design Intent**: Spatial efficiency, structural considerations, compliance with design standards
4. **Clash Detection**: Identification and resolution of spatial conflicts
5. **Constructability**: Real-world buildability, maintenance considerations, material specifications

RESPOND ONLY WITH THIS EXACT JSON STRUCTURE:
{
  "score": <number 0-100>,
  "strengths": [<array of 3-5 specific strengths>],
  "weaknesses": [<array of 2-4 specific areas for improvement>],
  "improvement_steps": [<array of 3-5 actionable steps>],
  "technical_risk": "<'low'|'medium'|'high'>"
}

Be objective, specific, and tie feedback to civil/structural engineering best practices and BIM standards.`;
}

/**
 * Build prompt parts for vision analysis
 */
function buildVisionPromptParts(text, images) {
  const parts = [];

  // Add text context
  if (text) {
    parts.push({
      text: `Student Self-Evaluation:\n${text}`
    });
  }

  // Add images with base64 encoding
  if (Array.isArray(images)) {
    for (const image of images) {
      if (image.data) {
        parts.push({
          inlineData: {
            mimeType: image.mimeType || 'image/jpeg',
            data: image.data
          }
        });
      }
    }
  }

  // Add final instruction
  parts.push({
    text: 'Analyze the provided Revit model design and self-evaluation. Provide feedback in the required JSON format.'
  });

  return parts;
}

/**
 * Parse JSON response from Gemini (handles code fences, etc.)
 */
function parseGeminiJson(text) {
  try {
    // Remove markdown code fences
    const cleaned = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '');

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.warn('[GEMINI] JSON parse failed:', err.message);
    // Return fallback structure
    return {
      score: 0,
      strengths: [],
      weaknesses: ['Unable to parse AI response'],
      improvement_steps: [],
      technical_risk: 'high',
      error: true,
      raw: text
    };
  }
}

/**
 * Get AI feedback from Gemini Vision Pro
 * Main function for evaluation requests
 */
async function getGeminiVisionFeedback(text, images = []) {
  try {
    // Validate input
    if (!text || text.length < 20) {
      throw new Error('Self-description too short (min 20 chars)');
    }

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('At least one image is required');
    }

    console.log('[GEMINI] Processing feedback request');
    console.log(`  - Text: ${text.length} characters`);
    console.log(`  - Images: ${images.length}`);

    // Initialize model
    const model = getGeminiModel();

    // Build prompt parts
    const parts = buildVisionPromptParts(text, images);

    // Call Gemini API
    console.log('[GEMINI] Calling Gemini 2.0 Flash Exp...');
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts
        }
      ]
    });

    // Get response
    const response = await result.response;
    const responseText = response.text();

    console.log('[GEMINI] Response received');

    // Parse JSON response
    const feedback = parseGeminiJson(responseText);

    // Validate response structure
    if (!feedback.score || !Array.isArray(feedback.strengths) || !Array.isArray(feedback.weaknesses)) {
      throw new Error('Invalid response structure from Gemini');
    }

    console.log(`[GEMINI] ✅ Feedback generated - Score: ${feedback.score}/100`);

    return feedback;

  } catch (err) {
    console.error('[GEMINI] Error:', err.message);
    throw err;
  }
}

// Legacy exports for backward compatibility
function buildVisionPromptParts_legacy(textContext, imageParts) {
  const { selfDescription, checklist, rubric } = textContext;
  const systemPrompt = `You are an assistant evaluating Autodesk Revit project outputs for civil engineering students.
Return ONLY a strict JSON object with the following keys: score (0-100), strengths (array of strings), weaknesses (array of strings), improvement_steps (array of strings), technical_risk (one of low|medium|high).
Criteria: modeling accuracy (dimensional consistency, element connectivity), BIM compliance (naming, LOD), design intent (spatial efficiency, structural or stress considerations), clash detection, constructability & maintainability.
Provide objective, specific critique tied to civil/structural engineering practices and BIM standards.`;

  const userText = `Student self-evaluation:\n${selfDescription || ''}\n\nChecklist selections:\n${typeof checklist === 'string' ? checklist : JSON.stringify(checklist || {})}\n\nRubric:\n${typeof rubric === 'string' ? rubric : JSON.stringify(rubric || {})}`;

  const preamble = [
    { text: systemPrompt },
    { text: userText }
  ];

  const parts = [
    ...preamble,
    ...imageParts
  ];

  parts.push({ text: 'Respond with ONLY JSON. No code fences.' });

  return parts;
}

module.exports = {
  getGeminiModel,
  getGeminiVisionFeedback,
  buildVisionPromptParts,
  parseGeminiJson,
  buildVisionPromptParts_legacy: buildVisionPromptParts_legacy
};


