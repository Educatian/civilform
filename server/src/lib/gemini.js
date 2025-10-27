'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiModel() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY or GOOGLE_API_KEY');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use a Vision model that accepts image parts
    return genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
}

function buildVisionPromptParts(textContext, imageParts) {
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
        ...imageParts // inlineData entries with base64
    ];

    // Add an explicit instruction to output JSON only
    parts.push({ text: 'Respond with ONLY JSON. No code fences.' });

    return parts;
}

function parseGeminiJson(text) {
    try {
        // Guard against code fences or extra prose
        const trimmed = text.trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '');
        const parsed = JSON.parse(trimmed);
        return parsed;
    } catch (_e) {
        // Fallback minimal structure
        return {
            score: null,
            strengths: [],
            weaknesses: [],
            improvement_steps: [],
            technical_risk: 'medium',
            raw: text
        };
    }
}

module.exports = { getGeminiModel, buildVisionPromptParts, parseGeminiJson };


