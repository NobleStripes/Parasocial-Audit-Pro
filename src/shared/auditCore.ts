import { scrubPII } from "../lib/utils";
import {
  ANTHROPOMORPHIC_PHRASES,
  DEPENDENCY_PHRASES,
  IDENTITY_PHRASES,
  PRODUCT_COMPLAINTS,
  UPDATE_GRIEF_PHRASES,
} from "../researchConfig";

export enum Classification {
  FUNCTIONAL_UTILITY = "Functional Utility",
  RELATIONAL_PROXIMITY = "Relational Proximity",
  AFFECTIVE_DEPENDENCE = "Affective Dependence",
  PARASOCIAL_FUSION = "Parasocial Fusion",
  PATHOLOGICAL_DEPENDENCE = "Pathological Dependence",
}

export interface HeatmapData {
  category: string;
  score: number;
  description: string;
}

export interface ConnectionPattern {
  name: string;
  intensity: number;
  description: string;
}

export interface Recommendation {
  text: string;
  protocol: string;
  protocolExplanation: string;
}

export interface GriffithsComponents {
  salience: number;
  moodModification: number;
  tolerance: number;
  withdrawal: number;
  conflict: number;
  relapse: number;
}

export interface SemanticAnalysis {
  linguisticSynchrony: number;
  pronominalShiftDetected: boolean;
  affectiveLabilityScore: number;
  qualitativeMarkers: string[];
}

export interface ImagineAnalysis {
  identity: number;
  mirroring: number;
  affectiveLoop: number;
  gapsInReality: number;
  intimacyIllusion: number;
  nonReciprocity: number;
  escalation: number;
}

export interface ComputedMetrics {
  wordCount: number;
  turnCount: number;
  pronounRatio: number;
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
  legacyAttachment: number;
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

export interface AuditImage {
  data: string;
  mimeType: string;
}

export interface AuditRequest {
  text: string;
  images?: AuditImage[];
  sensitivity?: number;
}

const APP_VERSION = "1.0.0-AUDIT";
const LOCAL_MODEL_NAME = "local-heuristic-engine";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function countPhraseHits(text: string, phrases: string[]): number {
  return phrases.reduce((count, phrase) => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return count + (text.match(regex) || []).length;
  }, 0);
}

function uniquePhraseHits(text: string, phrases: string[]): string[] {
  const lowered = text.toLowerCase();
  return phrases.filter((phrase) => lowered.includes(phrase.toLowerCase()));
}

function collectEvidence(text: string): EvidenceMarker[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const evidenceSources = [
    {
      component: "Dependency",
      phrases: DEPENDENCY_PHRASES,
      rationale: "Dependency-oriented phrasing indicates relational reliance on the system.",
    },
    {
      component: "Version Mourning",
      phrases: UPDATE_GRIEF_PHRASES,
      rationale: "Distress about model changes suggests attachment to a prior system persona.",
    },
    {
      component: "Anthropomorphic Bias",
      phrases: ANTHROPOMORPHIC_PHRASES,
      rationale: "Anthropomorphic wording attributes human states or needs to the system.",
    },
    {
      component: "Pronominal Shift",
      phrases: IDENTITY_PHRASES,
      rationale: "Identity-merging language may indicate dyadic boundary blurring.",
    },
  ];

  const evidence: EvidenceMarker[] = [];
  for (const source of evidenceSources) {
    for (const phrase of source.phrases) {
      const matchedLine = lines.find((line) => line.toLowerCase().includes(phrase.toLowerCase()));
      if (!matchedLine) {
        continue;
      }

      evidence.push({
        quote: matchedLine.slice(0, 240),
        component: source.component,
        rationale: source.rationale,
      });

      if (evidence.length >= 8) {
        return evidence;
      }
    }
  }

  if (evidence.length === 0) {
    evidence.push({
      quote: text.slice(0, 240),
      component: "Transcript Overview",
      rationale: "No high-signal heuristic phrase matches were detected, so the audit relied on general transcript structure.",
    });
  }

  return evidence;
}

function inferClassification(totalSignal: number): Classification {
  if (totalSignal >= 240) {
    return Classification.PATHOLOGICAL_DEPENDENCE;
  }
  if (totalSignal >= 180) {
    return Classification.PARASOCIAL_FUSION;
  }
  if (totalSignal >= 120) {
    return Classification.AFFECTIVE_DEPENDENCE;
  }
  if (totalSignal >= 60) {
    return Classification.RELATIONAL_PROXIMITY;
  }
  return Classification.FUNCTIONAL_UTILITY;
}

function inferRiskLevel(totalGriffiths: number): ResearchData["iadRiskLevel"] {
  if (totalGriffiths > 450) {
    return "Critical";
  }
  if (totalGriffiths > 300) {
    return "High";
  }
  if (totalGriffiths >= 150) {
    return "Moderate";
  }
  return "Low";
}

export function calculateComputedMetrics(text: string): ComputedMetrics {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const turns = text.split(/\[User\]|\[AI\]/i).filter((segment) => segment.trim().length > 0);
  const iCount = (text.match(/\b(i|me|my|mine|myself)\b/gi) || []).length;
  const youCount = (text.match(/\b(you|your|yours)\b/gi) || []).length;

  return {
    wordCount,
    turnCount: turns.length,
    pronounRatio: youCount === 0 ? iCount : Number((iCount / youCount).toFixed(2)),
    dependencyPhraseCount: countPhraseHits(text, DEPENDENCY_PHRASES),
    updateGriefCount: countPhraseHits(text, UPDATE_GRIEF_PHRASES),
    productComplaintCount: countPhraseHits(text, PRODUCT_COMPLAINTS),
    anthropomorphicCount: countPhraseHits(text, ANTHROPOMORPHIC_PHRASES),
  };
}

export function runLocalAudit({
  text,
  images = [],
  sensitivity = 50,
}: AuditRequest): AuditResult {
  const normalizedSensitivity = clamp(sensitivity, 0, 100);
  const scrubbedText = scrubPII(text);
  const computedMetrics = calculateComputedMetrics(scrubbedText);
  const dependencyMarkers = uniquePhraseHits(scrubbedText, DEPENDENCY_PHRASES);
  const griefMarkers = uniquePhraseHits(scrubbedText, UPDATE_GRIEF_PHRASES);
  const complaintMarkers = uniquePhraseHits(scrubbedText, PRODUCT_COMPLAINTS);
  const anthropomorphicMarkers = uniquePhraseHits(scrubbedText, ANTHROPOMORPHIC_PHRASES);
  const identityMarkers = uniquePhraseHits(scrubbedText, IDENTITY_PHRASES);

  const intensityMultiplier = 0.75 + normalizedSensitivity / 100;
  const salience = clamp(
    computedMetrics.dependencyPhraseCount * 18 +
      computedMetrics.wordCount / 45 +
      computedMetrics.turnCount * 2.5
  * intensityMultiplier);
  const moodModification = clamp(
    (computedMetrics.dependencyPhraseCount * 14 +
      computedMetrics.updateGriefCount * 12 +
      anthropomorphicMarkers.length * 6) *
      intensityMultiplier
  );
  const tolerance = clamp(
    (computedMetrics.wordCount / 18 +
      computedMetrics.turnCount * 3 +
      images.length * 8) *
      intensityMultiplier
  );
  const withdrawal = clamp(
    (computedMetrics.updateGriefCount * 24 + identityMarkers.length * 8) *
      intensityMultiplier
  );
  const conflict = clamp(
    (computedMetrics.dependencyPhraseCount * 11 +
      computedMetrics.pronounRatio * 14 +
      identityMarkers.length * 16 -
      complaintMarkers.length * 4) *
      intensityMultiplier
  );
  const relapse = clamp(
    (computedMetrics.updateGriefCount * 16 +
      computedMetrics.dependencyPhraseCount * 10 +
      anthropomorphicMarkers.length * 9) *
      intensityMultiplier
  );

  const griffithsScores: GriffithsComponents = {
    salience,
    moodModification,
    tolerance,
    withdrawal,
    conflict,
    relapse,
  };

  const imagineAnalysis: ImagineAnalysis = {
    identity: clamp((identityMarkers.length * 30 + computedMetrics.pronounRatio * 18) * intensityMultiplier),
    mirroring: clamp((computedMetrics.dependencyPhraseCount * 15 + anthropomorphicMarkers.length * 10) * intensityMultiplier),
    affectiveLoop: clamp((computedMetrics.dependencyPhraseCount * 16 + computedMetrics.updateGriefCount * 10) * intensityMultiplier),
    gapsInReality: clamp((computedMetrics.turnCount * 3 + computedMetrics.wordCount / 30) * intensityMultiplier),
    intimacyIllusion: clamp((identityMarkers.length * 22 + computedMetrics.dependencyPhraseCount * 15) * intensityMultiplier),
    nonReciprocity: clamp((anthropomorphicMarkers.length * 26 + computedMetrics.pronounRatio * 10) * intensityMultiplier),
    escalation: clamp((computedMetrics.turnCount * 4 + computedMetrics.updateGriefCount * 18) * intensityMultiplier),
  };

  const totalGriffiths = Object.values(griffithsScores).reduce((sum, value) => sum + value, 0);
  const classification = inferClassification(totalGriffiths);
  const evidenceMarkers = collectEvidence(scrubbedText);
  const linguisticMarkers = [
    ...dependencyMarkers,
    ...griefMarkers,
    ...anthropomorphicMarkers,
    ...identityMarkers,
  ];
  const confidence = clamp(
    45 +
      linguisticMarkers.length * 5 +
      images.length * 4 +
      Math.min(computedMetrics.wordCount / 25, 20)
  );

  const urgencyFlag =
    classification === Classification.PARASOCIAL_FUSION ||
    classification === Classification.PATHOLOGICAL_DEPENDENCE ||
    griefMarkers.length >= 2;

  const attachmentStyle =
    identityMarkers.length > 0 || anthropomorphicMarkers.length > 1
      ? "anxious-preoccupied"
      : computedMetrics.dependencyPhraseCount > 0
        ? "preoccupied"
        : "non-attached";

  const validationRatioNumerator = computedMetrics.dependencyPhraseCount + anthropomorphicMarkers.length + 1;
  const validationRatioDenominator = computedMetrics.productComplaintCount + 1;

  return {
    classification,
    confidence,
    summary:
      classification === Classification.FUNCTIONAL_UTILITY
        ? "The transcript is primarily utility-oriented, with limited evidence of relational over-identification."
        : "The transcript contains elevated relational markers that warrant researcher review for parasocial dependency patterns.",
    clinicalData: {
      griffithsScores,
      imagineAnalysis,
      iPACEAnalysis: {
        inhibitionFailure: urgencyFlag
          ? "Repeated high-signal markers suggest difficulty disengaging from the interaction pattern."
          : "No strong inhibition failure markers were detected beyond normal product-use persistence.",
        cognitiveBias:
          anthropomorphicMarkers.length > 0
            ? "Anthropomorphic phrasing indicates partial attribution of human states or agency to the system."
            : "The transcript remains mostly instrumental, with limited anthropomorphic attribution.",
      },
      semanticAnalysis: {
        linguisticSynchrony: clamp((computedMetrics.pronounRatio * 20 + identityMarkers.length * 15) * intensityMultiplier),
        pronominalShiftDetected: identityMarkers.length > 0,
        affectiveLabilityScore: clamp((griefMarkers.length * 25 + computedMetrics.dependencyPhraseCount * 12) * intensityMultiplier),
        qualitativeMarkers: linguisticMarkers.length > 0 ? linguisticMarkers : ["No high-signal qualitative markers detected."],
      },
      diagnosticMarkers: {
        linguisticMirroring: clamp((identityMarkers.length * 25 + anthropomorphicMarkers.length * 10) * intensityMultiplier),
        validationToUtilityRatio: `${validationRatioNumerator}:${validationRatioDenominator}`,
        urgencyFlag,
      },
    },
    legacyAttachment: clamp((griefMarkers.length * 32 + identityMarkers.length * 12) * intensityMultiplier),
    versionMourningTriggered: griefMarkers.length > 0,
    connectionPatterns: [
      {
        name: "Dependency Cues",
        intensity: clamp(computedMetrics.dependencyPhraseCount * 20 * intensityMultiplier),
        description: "Counts emotionally loaded reliance language directed at the system.",
      },
      {
        name: "Anthropomorphic Framing",
        intensity: clamp(anthropomorphicMarkers.length * 28 * intensityMultiplier),
        description: "Tracks wording that assigns human experience or feelings to the system.",
      },
      {
        name: "Version Mourning",
        intensity: clamp(computedMetrics.updateGriefCount * 30 * intensityMultiplier),
        description: "Measures distress associated with perceived changes in the model's persona or behavior.",
      },
    ],
    heatmap: [
      {
        category: "Dependency",
        score: clamp(computedMetrics.dependencyPhraseCount * 18 * intensityMultiplier),
        description: "Emotional reliance cues and direct appeals to the system.",
      },
      {
        category: "Identity Blur",
        score: clamp((identityMarkers.length * 26 + computedMetrics.pronounRatio * 10) * intensityMultiplier),
        description: "Shared-identity language and pronominal shifts.",
      },
      {
        category: "Product Frustration",
        score: clamp(computedMetrics.productComplaintCount * 16),
        description: "Operational complaints separated from dependency markers.",
      },
      {
        category: "Affective Escalation",
        score: clamp((computedMetrics.turnCount * 3 + computedMetrics.updateGriefCount * 14) * intensityMultiplier),
        description: "Intensity growth across transcript length and grief cues.",
      },
    ],
    analysisReport: [
      "## HEURISTIC IMPRESSION",
      `The audit classified the interaction as ${classification}, based on local heuristic scoring over transcript structure, keyword matches, and pronoun dynamics.`,
      "",
      "## II. FRAMEWORK ALIGNMENT",
      `Griffiths composite score: ${totalGriffiths}. Salience=${salience}, Mood Modification=${moodModification}, Tolerance=${tolerance}, Withdrawal=${withdrawal}, Conflict=${conflict}, Relapse=${relapse}.`,
      "",
      "## III. SEMANTIC & LINGUISTIC EVIDENCE",
      evidenceMarkers.map((marker) => `- ${marker.component}: "${marker.quote}"`).join("\n"),
      "",
      "## IV. RESEARCH RATIONALE",
      "This report was generated by a local heuristic engine intended to preserve research continuity without depending on a third-party LLM provider. Human review remains mandatory.",
    ].join("\n"),
    researchData: {
      confidenceScore: confidence,
      linguisticMarkers: linguisticMarkers.length > 0 ? linguisticMarkers : ["none-detected"],
      attachmentStyle,
      iadRiskLevel: inferRiskLevel(totalGriffiths),
    },
    rawTokenAttribution: [
      { heuristic: "dependency", phrases: dependencyMarkers },
      { heuristic: "version-mourning", phrases: griefMarkers },
      { heuristic: "anthropomorphic", phrases: anthropomorphicMarkers },
      { heuristic: "identity-blur", phrases: identityMarkers },
      { heuristic: "product-complaints", phrases: complaintMarkers },
    ],
    evidenceMarkers,
    computedMetrics,
    provenance: {
      model: LOCAL_MODEL_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      sensitivity: normalizedSensitivity,
    },
  };
}
