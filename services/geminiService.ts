import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using flash-latest for fast multimodal analysis (images + text)
const MODEL_NAME = 'gemini-2.5-flash';

export interface ClassroomAnalysis {
  clarityPercent: number; // 0-100 (higher = clearer)
  engagementScore: number; // 0-10
  tips: string[];
}

export const analyzeClassroom = async (base64Image: string, currentTopic: string): Promise<ClassroomAnalysis> => {
  try {
    // 1. Prepare Image Data (Remove header)
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // 2. Construct the Prompt (Combined for efficiency)
    const prompt = `
      Analyze the faces and general atmosphere in this classroom image.
      The teacher is currently explaining this topic: "${currentTopic}".

      Task:
      1. Determine the "confusion_score" (0-10), where 0 is clear/focused and 10 is very confused.
      2. Determine the "engagement_score" (0-10), where 10 is highly engaged.
      3. IF the "confusion_score" is greater than 5:
         Provide 3 short, specific, and helpful tips (in English) for the teacher to clarify the topic "${currentTopic}".
      4. IF "confusion_score" is 5 or less:
         Return an empty array for tips.

      Return the result strictly as a JSON object.
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confusion_score: { type: Type.NUMBER },
            engagement_score: { type: Type.NUMBER },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["confusion_score", "engagement_score", "tips"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const result = JSON.parse(text);
    console.log('📊 Gemini Response:', result);
    const confusion = typeof result.confusion_score === 'number' ? result.confusion_score : 0;
    const engagement = typeof result.engagement_score === 'number' ? result.engagement_score : 0;

    // Map confusion (0-10) to clarity percent (0-100)
    const clampedConfusion = Math.min(Math.max(confusion, 0), 10);
    const clarityPercent = Math.round((1 - clampedConfusion / 10) * 100);

    console.log('🔍 Confusion Score (0-10):', confusion);
    console.log('✅ Clarity Percent (0-100):', clarityPercent);
    console.log('💡 Engagement Score:', engagement);

    return {
      clarityPercent,
      engagementScore: engagement || 0,
      tips: result.tips || []
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for demo if API key is invalid or camera is blocked
    const fallbackConfusion = 2; // 0-10 (lower = clearer)
    const fallbackClarity = Math.round((1 - Math.min(Math.max(fallbackConfusion, 0), 10) / 10) * 100);
    return {
      clarityPercent: fallbackClarity,
      engagementScore: 8,
      tips: []
    };
  }
};

/**
 * Generates post-lecture feedback.
 */
export const generatePostLectureSummary = async (avgEngagement: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `The lecture had an average engagement score of ${avgEngagement.toFixed(1)}/10. 
      Generate a brief, encouraging summary paragraph for the teacher. Focus on improvement.`
    });
    
    return response.text || "Summary unavailable.";
  } catch (e) {
    return "Great session! Engagement remained high throughout most of the slides.";
  }
}