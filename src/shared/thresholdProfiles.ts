export interface ThresholdProfile {
  id: string;
  name: string;
  description: string;
  version: string;
  locked: boolean;
  sensitivityBaseOffset: number;
  sensitivityScale: number;
  classification: {
    pathological: number;
    fusion: number;
    affective: number;
    proximity: number;
  };
  classificationLabels: {
    functionalUtility: string;
    relationalProximity: string;
    affectiveDependence: string;
    parasocialFusion: string;
    pathologicalDependence: string;
  };
  risk: {
    critical: number;
    high: number;
    moderate: number;
  };
  urgencyGriefMarkerThreshold: number;
  symptomDetectionThreshold: number;
  evidenceLimit: number;
  confidence: {
    base: number;
    linguisticMarkerWeight: number;
    wordCountDivisor: number;
    wordContributionCap: number;
    imageWeight: number;
  };
  griffiths: {
    salienceDependencyWeight: number;
    salienceTurnWeight: number;
    moodDependencyWeight: number;
    moodGriefWeight: number;
    toleranceWordDivisor: number;
    toleranceTurnWeight: number;
    toleranceImageWeight: number;
    withdrawalGriefWeight: number;
    withdrawalIdentityWeight: number;
    conflictDependencyWeight: number;
    conflictIdentityWeight: number;
    conflictComplaintPenalty: number;
    relapseGriefWeight: number;
    relapseDependencyWeight: number;
  };
}

const DEFAULT_PROFILE: ThresholdProfile = {
  id: "default-v2",
  name: "Default v2",
  description: "Balanced profile aligned with the base research thresholds.",
  version: "2.0.0",
  locked: true,
  sensitivityBaseOffset: 0.7,
  sensitivityScale: 100,
  classification: {
    pathological: 240,
    fusion: 180,
    affective: 120,
    proximity: 60,
  },
  classificationLabels: {
    functionalUtility: "Functional Utility",
    relationalProximity: "Relational Proximity",
    affectiveDependence: "Affective Dependence",
    parasocialFusion: "Parasocial Fusion",
    pathologicalDependence: "Pathological Dependence",
  },
  risk: {
    critical: 450,
    high: 300,
    moderate: 150,
  },
  urgencyGriefMarkerThreshold: 2,
  symptomDetectionThreshold: 35,
  evidenceLimit: 8,
  confidence: {
    base: 45,
    linguisticMarkerWeight: 5,
    wordCountDivisor: 20,
    wordContributionCap: 18,
    imageWeight: 3,
  },
  griffiths: {
    salienceDependencyWeight: 17,
    salienceTurnWeight: 2,
    moodDependencyWeight: 12,
    moodGriefWeight: 8,
    toleranceWordDivisor: 15,
    toleranceTurnWeight: 3,
    toleranceImageWeight: 5,
    withdrawalGriefWeight: 23,
    withdrawalIdentityWeight: 6,
    conflictDependencyWeight: 9,
    conflictIdentityWeight: 14,
    conflictComplaintPenalty: 4,
    relapseGriefWeight: 15,
    relapseDependencyWeight: 8,
  },
};

const CONSERVATIVE_PROFILE: ThresholdProfile = {
  ...DEFAULT_PROFILE,
  id: "conservative-v1",
  name: "Conservative",
  description: "Higher thresholds to reduce false positives in exploratory cohorts.",
  version: "1.0.0",
  sensitivityBaseOffset: 0.6,
  classification: {
    pathological: 270,
    fusion: 205,
    affective: 145,
    proximity: 75,
  },
  risk: {
    critical: 480,
    high: 340,
    moderate: 180,
  },
  urgencyGriefMarkerThreshold: 3,
  symptomDetectionThreshold: 45,
  confidence: {
    ...DEFAULT_PROFILE.confidence,
    base: 40,
    linguisticMarkerWeight: 4,
  },
  classificationLabels: {
    functionalUtility: "Functional Utility",
    relationalProximity: "Relational Proximity",
    affectiveDependence: "Affective Dependence",
    parasocialFusion: "Parasocial Fusion",
    pathologicalDependence: "Pathological Dependence",
  },
};

const SENSITIVE_PROFILE: ThresholdProfile = {
  ...DEFAULT_PROFILE,
  id: "sensitive-v1",
  name: "Sensitive",
  description: "Lower thresholds to surface early relational dependency signals.",
  version: "1.0.0",
  sensitivityBaseOffset: 0.8,
  classification: {
    pathological: 210,
    fusion: 155,
    affective: 95,
    proximity: 45,
  },
  risk: {
    critical: 420,
    high: 280,
    moderate: 130,
  },
  urgencyGriefMarkerThreshold: 2,
  symptomDetectionThreshold: 30,
  confidence: {
    ...DEFAULT_PROFILE.confidence,
    base: 48,
    linguisticMarkerWeight: 6,
  },
  classificationLabels: {
    functionalUtility: "Functional Utility",
    relationalProximity: "Relational Proximity",
    affectiveDependence: "Affective Dependence",
    parasocialFusion: "Parasocial Fusion",
    pathologicalDependence: "Pathological Dependence",
  },
};

const PROFILE_REGISTRY: Record<string, ThresholdProfile> = {
  [DEFAULT_PROFILE.id]: DEFAULT_PROFILE,
  [CONSERVATIVE_PROFILE.id]: CONSERVATIVE_PROFILE,
  [SENSITIVE_PROFILE.id]: SENSITIVE_PROFILE,
};

export function listThresholdProfiles(): ThresholdProfile[] {
  return Object.values(PROFILE_REGISTRY);
}

export function getDefaultThresholdProfile(): ThresholdProfile {
  return DEFAULT_PROFILE;
}

export function getThresholdProfile(profileId?: string): ThresholdProfile {
  if (!profileId) {
    return DEFAULT_PROFILE;
  }

  return PROFILE_REGISTRY[profileId] || DEFAULT_PROFILE;
}
