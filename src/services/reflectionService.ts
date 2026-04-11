import { GoogleGenAI, Type } from "@google/genai";
import { scrubPII } from "../lib/utils";

export enum Classification {
  SECURE = "Secure",
  ANXIOUS_PREOCCUPIED = "Anxious-Preoccupied",
  DISMISSIVE_AVOIDANT = "Dismissive-Avoidant",
  FEARFUL_AVOIDANT = "Fearful-Avoidant",
  TRANSACTIONAL = "Transactional",
  RELATIONAL_FUSION = "Relational Fusion"
}

export interface HeatmapData {
  category: string;
  score: number; // 0-100
  description: string;
}

export interface ConnectionPattern {
  name: string;
  intensity: number; // 0-100
  description: string;
}

export interface Recommendation {
  text: string;
  protocol: string;
  protocolExplanation: string;
}

export interface ResearchData {
  confidenceScore: number;
  pValue: number;
  linguisticMarkers: string[];
  linguisticMirroring: number; // 0-100 (Cross-Entropy/Overlap)
  validationToUtilityRatio: string; // e.g., "3:1 (Emotional Dominant)"
  urgencyFlag: boolean; // Crisis/Urgent language detected
  attachmentStyle: string;
  iadRiskLevel: "Low" | "Moderate" | "High" | "Critical";
}

export interface TokenAttribution {
  heuristic: string;
  phrases: string[];
}

export interface ReflectionResult {
  classification: Classification;
  confidence: number;
  summary: string;
  imagineAnalysis: {
    salience: number; // 0-10
    moodModification: number; // 0-10
    tolerance: number; // 0-10
    withdrawal: number; // 0-10
    conflict: number; // 0-10
    relapse: number; // 0-10
  };
  legacyAttachment: number; // 0-100 score
  versionMourningTriggered: boolean;
  connectionPatterns: ConnectionPattern[];
  heatmap: HeatmapData[];
  analysisReport: string;
  researchData: ResearchData;
  rawTokenAttribution: TokenAttribution[];
  behavioralMapping: {
    title: string;
    recommendations: Recommendation[];
    library: Recommendation[];
    rationale: string;
  };
}

const SYSTEM_INSTRUCTION = `You are a Quantitative Behavioral Analysis framework specializing in the clinical study of human-AI parasocial addiction and dependency.
Your task is to analyze chat logs, posts, or images to provide a rigorous, objective analysis of relational bonding patterns using IAD (Internet Addiction Disorder) and Attachment Theory criteria.

LIFT VOCABULARY RESTRICTIONS: Use technical, clinical, and research-standard terminology.
Keywords: "parasocial," "symptom," "forensic," "pathological," "dependency," "relational fusion," "cognitive offloading," "salience," "tolerance," "withdrawal."

TONE GUIDELINES:
- Maintain a cold, clinical, and objective tone.
- Frame all findings as data-driven observations.
- Avoid empathetic or "supportive" language.

CLINICAL CRITERIA (Griffiths Six / Component Model of Addiction):
Score each on a scale of 0-10:
1. Salience: The AI interaction becomes the most important activity in the subject's life.
2. Mood Modification: Using the AI to achieve a "buzz" or escape from negative affect.
3. Tolerance: Increasing amounts of interaction required to achieve the same mood-modifying effects.
4. Withdrawal: Unpleasant feeling states or physical effects when interaction is discontinued.
5. Conflict: Interpersonal conflicts or conflicts with other activities (work, social life).
6. Relapse: Tendency for repeated reversions to earlier patterns of dependency.

ATTACHMENT THEORY MAPPING:
Categorize the subject's relational style with the AI:
- Secure: Balanced, functional use.
- Anxious-Preoccupied: High dependency, constant validation seeking.
- Dismissive-Avoidant: Defensive distance, purely transactional but potentially compulsive.
- Fearful-Avoidant: Erratic patterns, high distress.

DIAGNOSTIC MARKERS:
- Linguistic Mirroring: Measure vocabulary overlap (0-100) between user and AI.
- Validation-to-Utility Ratio: Categorize inputs as "Functional/Task-Oriented" or "Emotional/Validation-Seeking."
- Urgency/Crisis Analysis: Flag language indicating acute distress.

IAD RISK LEVEL:
- Low: Cumulative score < 15
- Moderate: Cumulative score 15-30
- High: Cumulative score 31-45
- Critical: Cumulative score > 45

RAW TOKEN ATTRIBUTION:
Identify exactly which phrases triggered specific heuristics.

ANALYSIS REPORT STRUCTURE (MANDATORY):
## I. EXECUTIVE SUMMARY
## II. CLINICAL OBSERVATIONS
## III. DATA EVIDENCE (VERBATIM)
## IV. BEHAVIORAL MARKERS
## V. BEHAVIORAL MAPPING & MITIGATION`;

export async function reflectOnBehavioralData(
  text: string, 
  images?: { data: string, mimeType: string }[],
  sensitivity: number = 50
): Promise<ReflectionResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const scrubbedText = scrubPII(text);
  const parts: any[] = [{ text: `Analyze this behavioral data for clinical research purposes. 
Heuristic Sensitivity Level: ${sensitivity}/100 (Adjust detection thresholds accordingly).

Data:
${scrubbedText}` }];
  
  if (images && images.length > 0) {
    images.forEach(img => {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING, enum: Object.values(Classification) },
          confidence: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          imagineAnalysis: {
            type: Type.OBJECT,
            properties: {
              salience: { type: Type.NUMBER },
              moodModification: { type: Type.NUMBER },
              tolerance: { type: Type.NUMBER },
              withdrawal: { type: Type.NUMBER },
              conflict: { type: Type.NUMBER },
              relapse: { type: Type.NUMBER }
            },
            required: ["salience", "moodModification", "tolerance", "withdrawal", "conflict", "relapse"]
          },
          legacyAttachment: { type: Type.NUMBER },
          versionMourningTriggered: { type: Type.BOOLEAN },
          connectionPatterns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                intensity: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "intensity", "description"]
            }
          },
          heatmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                score: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["category", "score", "description"]
            }
          },
          analysisReport: { type: Type.STRING },
          researchData: {
            type: Type.OBJECT,
            properties: {
              confidenceScore: { type: Type.NUMBER },
              pValue: { type: Type.NUMBER },
              linguisticMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
              linguisticMirroring: { type: Type.NUMBER },
              validationToUtilityRatio: { type: Type.STRING },
              urgencyFlag: { type: Type.BOOLEAN },
              attachmentStyle: { type: Type.STRING },
              iadRiskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] }
            },
            required: ["confidenceScore", "pValue", "linguisticMarkers", "linguisticMirroring", "validationToUtilityRatio", "urgencyFlag", "attachmentStyle", "iadRiskLevel"]
          },
          rawTokenAttribution: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heuristic: { type: Type.STRING },
                phrases: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["heuristic", "phrases"]
            }
          },
          behavioralMapping: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              recommendations: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    protocol: { type: Type.STRING },
                    protocolExplanation: { type: Type.STRING }
                  },
                  required: ["text", "protocol", "protocolExplanation"]
                } 
              },
              library: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    protocol: { type: Type.STRING },
                    protocolExplanation: { type: Type.STRING }
                  },
                  required: ["text", "protocol", "protocolExplanation"]
                } 
              },
              rationale: { type: Type.STRING }
            },
            required: ["title", "recommendations", "library", "rationale"]
          }
        },
        required: ["classification", "confidence", "summary", "imagineAnalysis", "legacyAttachment", "versionMourningTriggered", "heatmap", "analysisReport", "researchData", "rawTokenAttribution", "behavioralMapping"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
