import { GoogleGenAI, Type } from "@google/genai";

const MODEL_NAME = 'gemini-3-flash-preview';

// Lazy initialization to prevent crash on load if API key is missing
let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (!aiClient) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.log("Gemini API Key is MISSING. Using dummy key. API calls will fail or use simulation.");
            // Initialize with a dummy key to satisfy the constructor, but calls will fail
            aiClient = new GoogleGenAI({ apiKey: 'MISSING_API_KEY' });
        } else {
            console.log("Using Real Gemini API Key.");
            aiClient = new GoogleGenAI({ apiKey });
        }
    }
    return aiClient;
};

export interface ClassroomAnalysis {
  confusionScore: number; // 0-10
  engagementScore: number; // 0-10
  tips: string[];
}

// --- MOCK DATA FOR DEMONSTRATION ---
let mockIndex = 0;
const MOCK_SCENARIOS: ClassroomAnalysis[] = [
  { confusionScore: 1, engagementScore: 9, tips: [] }, // State: Clear
  { confusionScore: 4, engagementScore: 7, tips: ['Check if students understand the bias term.'] }, // State: Mixed
  { 
    confusionScore: 8, 
    engagementScore: 4, 
    tips: [
        'Simplify the explanation of Gradient Descent.', 
        'Use a real-world analogy (e.g., walking down a hill).', 
        'Ask a checking question to the back row.'
    ] 
  } // State: Confused
];

/**
 * Analyzes a classroom frame.
 * Now accepts an optional `slideImageBase64` to provide context about what is being shown.
 */
export const analyzeClassroom = async (
    classroomImageBase64: string, 
    currentTopic: string, 
    simulate: boolean = true,
    slideImageBase64?: string
): Promise<ClassroomAnalysis> => {
  
  // 1. SIMULATION MODE (For Demo/Testing States)
  // Force simulation if no API key is present
  if (!process.env.API_KEY && !simulate) {
      console.warn("No API Key found. Forcing simulation mode.");
      simulate = true;
  }

  if (simulate) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const scenario = MOCK_SCENARIOS[mockIndex];
            mockIndex = (mockIndex + 1) % MOCK_SCENARIOS.length; // Cycle through states
            resolve(scenario);
        }, 800); // Simulate network delay
    });
  }

  // 2. REAL GEMINI API CALL
  try {
    const cleanClassroomImage = classroomImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const requestParts: any[] = [
      { inlineData: { mimeType: 'image/jpeg', data: cleanClassroomImage } },
    ];

    // If we have the slide image, add it to the request
    if (slideImageBase64) {
         const cleanSlideImage = slideImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
         requestParts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanSlideImage } });
    }

    const promptText = `You are an AI teaching assistant monitoring a live class. Input 1: An image of the classroom/students (or the teacher). ${slideImageBase64 ? 'Input 2: The current presentation slide being shown to students.' : ''} Context: The topic being discussed is: "${currentTopic}". Task: 1. Analyze the facial expressions and posture in the classroom image to determine the "confusion_score" (0-10) and "engagement_score" (0-10). 2. Look at the Slide Image (if provided). Is the slide content dense, complex, or text-heavy? Does it align with the confusion level? 3. IF "confusion_score" > 5: Provide 3 short, actionable teaching tips. - Reference the specific content on the slide if relevant (e.g., "Explain the graph on the left"). 4. IF "confusion_score" <= 5: Return an empty array for tips. Return the result strictly as a JSON object.`;

    requestParts.push({ text: promptText });

    const response = await getAiClient().models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: requestParts
      },
      config: {
        responseMimeType: 'application/json',
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
          required: ['confusion_score', 'engagement_score', 'tips']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');

    const result = JSON.parse(text);
    console.log("Gemini Output:", result);

    return {
      confusionScore: result.confusion_score || 0,
      engagementScore: result.engagement_score || 0,
      tips: result.tips || []
    };

  } catch (error) {
    console.error('Gemini Analysis Failed:', error);
    // Fallback if API fails
    return {
      confusionScore: 2,
      engagementScore: 8,
      tips: []
    };
  }
};

export const generatePostLectureSummary = async (avgEngagement: number): Promise<string> => {
  try {
    const promptParts = [
        'The lecture had an average engagement score of ' + avgEngagement.toFixed(1) + '10.',
        'Generate a brief, encouraging summary paragraph for the teacher. Focus on improvement.'
    ];
    const prompt = promptParts.join(' ');
    
    const response = await getAiClient().models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });
    
    return response.text || 'Summary unavailable.';
  } catch (e) {
    return 'Great session! Engagement remained high throughout most of the slides.';
  }
}

/**
 * Generates a structured lecture (JSON) from raw text extracted from a PDF.
 */
export const generateLectureFromText = async (rawText: string): Promise<any> => {
    try {
        const promptParts = [
            'You are an expert educational content creator. I will provide you with the raw text extracted from a PDF presentation.',
            'Your task is to structure this content into a JSON object compatible with my lecture app.',
            '',
            'Raw Text:',
            rawText.substring(0, 30000), // Limit characters to avoid token limits if PDF is huge
            '',
            'Requirements:',
            '1. Extract a suitable "title" for the lecture.',
            '2. Write a brief "description".',
            '3. Create a "slides" array. For each logical section/slide in the text:',
            '   - "title": The slide header.',
            '   - "content": Bullet points or main text (keep it concise).',
            '   - "notes": Infer speaker notes. What should the teacher say to explain this slide? Be helpful and pedagogical.',
            '',
            'Return strictly JSON.'
        ];

        const prompt = promptParts.join('\n');

        const response = await getAiClient().models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        slides: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    title: { type: Type.STRING },
                                    content: { type: Type.STRING },
                                    notes: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ['title', 'description', 'slides']
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error('Empty response from Gemini for PDF conversion');
        
        return JSON.parse(text);

    } catch (error) {
        console.error("PDF to Lecture conversion failed:", error);
        throw error;
    }
}