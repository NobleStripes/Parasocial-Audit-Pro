import { scrubPII } from "../lib/utils";
import { 
  DEPENDENCY_PHRASES, 
  UPDATE_GRIEF_PHRASES, 
  PRODUCT_COMPLAINTS, 
  ANTHROPOMORPHIC_PHRASES, 
  IDENTITY_PHRASES 
} from "../researchConfig";

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

export interface SemanticAnalysis {
  linguisticSynchrony: number; // LSM score 0-100
  pronominalShiftDetected: boolean;
  affectiveLabilityScore: number; // 0-100
  qualitativeMarkers: string[];
}

export interface ImagineAnalysis {
  identity: number; // 0-100
  mirroring: number; // 0-100
  affectiveLoop: number; // 0-100
  gapsInReality: number; // 0-100
  intimacyIllusion: number; // 0-100
  nonReciprocity: number; // 0-100
  escalation: number; // 0-100
}

export interface ComputedMetrics {
  wordCount: number;
  turnCount: number;
  pronounRatio: number; // I/Me vs You/AI
  dependencyPhraseCount: number;
  updateGriefCount: number;
  productComplaintCount: number;
  anthropomorphicCount: number;
}

export interface ClinicalData {
  griffithsScores: GriffithsComponents;
  imagineAnalysis: ImagineAnalysis;
  iPACEAnalysis: {
    inhibitionFailure: string;
    cognitiveBias: string;
  };
  semanticAnalysis: SemanticAnalysis;
  diagnosticMarkers: {
    linguisticMirroring: number;
    validationToUtilityRatio: string;
    urgencyFlag: boolean;
  };
}

export interface ResearchData {
  confidenceScore: number;
  linguisticMarkers: string[];
  attachmentStyle: string;
  iadRiskLevel: "Low" | "Moderate" | "High" | "Critical";
}

export interface TokenAttribution {
  heuristic: string;
  phrases: string[];
}

export interface EvidenceMarker {
  quote: string;
  component: string;
  rationale: string;
}

export interface AuditResult {
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
  evidenceMarkers: EvidenceMarker[];
  computedMetrics: ComputedMetrics;
  provenance: {
    model: string;
    version: string;
    timestamp: string;
    sensitivity: number;
  };
}


function calculateComputedMetrics(text: string): ComputedMetrics {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  
  const turns = text.split(/\[User\]|\[AI\]/i).filter(t => t.trim().length > 0);
  const turnCount = turns.length;
  
  const iCount = (text.match(/\b(i|me|my|mine|myself)\b/gi) || []).length;
  const youCount = (text.match(/\b(you|your|yours)\b/gi) || []).length;
  const pronounRatio = youCount === 0 ? iCount : iCount / youCount;
  
  const countPhrases = (phrases: string[]) => {
    let count = 0;
    phrases.forEach(p => {
      const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      count += (text.match(regex) || []).length;
    });
    return count;
  };
  
  return {
    wordCount,
    turnCount,
    pronounRatio,
    dependencyPhraseCount: countPhrases(DEPENDENCY_PHRASES),
    updateGriefCount: countPhrases(UPDATE_GRIEF_PHRASES),
    productComplaintCount: countPhrases(PRODUCT_COMPLAINTS),
    anthropomorphicCount: countPhrases(ANTHROPOMORPHIC_PHRASES)
  };
}

export async function performForensicAudit(
  text: string,
  images?: { data: string; mimeType: string }[],
  sensitivity: number = 50
): Promise<AuditResult> {
  const scrubbedText = scrubPII(text);
  const computedMetrics = calculateComputedMetrics(scrubbedText);

  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scrubbedText, computedMetrics, sensitivity, images })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Audit API error ${response.status}: ${err.error}`);
  }

  const result = await response.json();

  return {
    ...result,
    computedMetrics,
    provenance: {
      model: "claude-opus-4-6",
      version: "1.0.0-AUDIT",
      timestamp: new Date().toISOString(),
      sensitivity
    }
  };
}
