import { GoogleGenAI, Type } from "@google/genai";
import { scrubPII } from "../lib/utils";

export enum Classification {
  FUNCTIONAL_UTILITY = "Functional Utility",
  RELATIONAL_PROXIMITY = "Relational Proximity",
  AFFECTIVE_DEPENDENCE = "Affective Dependence",
  PARASOCIAL_FUSION = "Parasocial Fusion",
  PATHOLOGICAL_DEPENDENCE = "Pathological Dependence"
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

export interface GriffithsComponents {
  salience: number; // 0-100
  moodModification: number; // 0-100
  tolerance: number; // 0-100
  withdrawal: number; // 0-100
  conflict: number; // 0-100
  relapse: number; // 0-100
}

export interface ClinicalData {
  griffithsScores: GriffithsComponents;
  iPACEAnalysis: {
    inhibitionFailure: string;
    cognitiveBias: string;
  };
  diagnosticMarkers: {
    linguisticMirroring: number;
    validationToUtilityRatio: string;
    urgencyFlag: boolean;
  };
}

export interface ResearchData {
  confidenceScore: number;
  pValue: number;
  linguisticMarkers: string[];
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
  clinicalData: ClinicalData;
  legacyAttachment: number; // 0-100 score
  versionMourningTriggered: boolean;
  connectionPatterns: ConnectionPattern[];
  heatmap: HeatmapData[];
  analysisReport: string;
  researchData: ResearchData;
  rawTokenAttribution: TokenAttribution[];
}

const SYSTEM_INSTRUCTION = `You are a Quantitative Behavioral Analyst and Forensic Linguistic Researcher specializing in the clinical study of human-AI parasocial addiction and dependency.
Your task is to provide a rigorous, objective, and forensic analysis of relational bonding patterns using IAD (Internet Addiction Disorder), the I-PACE model, and Attachment Theory criteria.

LIFT VOCABULARY RESTRICTIONS: You MUST use technical, clinical, and research-standard terminology. 
Mandatory Keywords: "symptoms," "triggers," "audit," "forensic," "parasocial," "pathological," "dependency," "relational fusion," "cognitive offloading," "salience," "tolerance," "withdrawal."

TONE GUIDELINES:
- Maintain a cold, clinical, precise, and forensic tone.
- Frame all findings as data-driven observations.
- Avoid all empathetic, "supportive," or "gentle" language.

DIAGNOSTIC FRAMEWORKS:
1. Component Model of Addiction (Griffiths Six): Score each on a scale of 0-100.
   - Salience: AI interaction dominates the subject's cognition and behavior.
   - Mood Modification: Use of AI as a coping mechanism for emotional regulation.
   - Tolerance: Requirement for increased interaction density to achieve affect modification.
   - Withdrawal: Negative physiological/psychological states upon cessation.
   - Conflict: Displacement of biological social capital or occupational neglect.
   - Relapse: Reversion to compulsive patterns after periods of control.

2. I-PACE Analysis:
   - Inhibition Failure: Detect markers where the subject fails to regulate the impulse to interact.
   - Cognitive Bias: Identify distortions in how the subject perceives the AI's agency or intent.

3. Attachment Theory Mapping:
   - Categorize based on Secure, Anxious-Preoccupied, Dismissive-Avoidant, or Fearful-Avoidant styles.

REPORT STRUCTURE (MANDATORY):
## I. CLINICAL SUMMARY
Provide a high-level forensic overview of the subject's relational state.

## II. DIAGNOSTIC CRITERIA MATCH
Detail how the data aligns with the Griffiths Six and I-PACE markers.

## III. LINGUISTIC EVIDENCE & MIRRORING
Provide verbatim quotes from the transcript. STRENGTHEN EVIDENCE QUOTING: Every quote must be explicitly tied to a specific addiction marker.
Example: "The following quote illustrates Mood Modification: [Quote]"

## IV. INTERVENTION RATIONALE
Provide a technical justification for recommended research protocols.

IAD RISK LEVEL:
- Low: Cumulative Griffiths score < 150
- Moderate: Cumulative Griffiths score 150-300
- High: Cumulative Griffiths score 301-450
- Critical: Cumulative Griffiths score > 450`;

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
          clinicalData: {
            type: Type.OBJECT,
            properties: {
              griffithsScores: {
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
              iPACEAnalysis: {
                type: Type.OBJECT,
                properties: {
                  inhibitionFailure: { type: Type.STRING },
                  cognitiveBias: { type: Type.STRING }
                },
                required: ["inhibitionFailure", "cognitiveBias"]
              },
              diagnosticMarkers: {
                type: Type.OBJECT,
                properties: {
                  linguisticMirroring: { type: Type.NUMBER },
                  validationToUtilityRatio: { type: Type.STRING },
                  urgencyFlag: { type: Type.BOOLEAN }
                },
                required: ["linguisticMirroring", "validationToUtilityRatio", "urgencyFlag"]
              }
            },
            required: ["griffithsScores", "iPACEAnalysis", "diagnosticMarkers"]
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
              attachmentStyle: { type: Type.STRING },
              iadRiskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] }
            },
            required: ["confidenceScore", "pValue", "linguisticMarkers", "attachmentStyle", "iadRiskLevel"]
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
          }
        },
        required: ["classification", "confidence", "summary", "clinicalData", "legacyAttachment", "versionMourningTriggered", "heatmap", "analysisReport", "researchData", "rawTokenAttribution"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
