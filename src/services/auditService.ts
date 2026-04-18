import type { AuditImage, AuditResult, Recommendation } from "../shared/auditCore";
export { Classification } from "../shared/auditCore";
export type {
  AuditImage,
  AuditResult,
  ClinicalData,
  ComputedMetrics,
  ConnectionPattern,
  EvidenceMarker,
  GriffithsComponents,
  HeatmapData,
  ImagineAnalysis,
  Recommendation,
  ResearchData,
  SemanticAnalysis,
  TokenAttribution,
} from "../shared/auditCore";

export async function performForensicAudit(
  text: string,
  images: AuditImage[] = [],
  sensitivity = 50
): Promise<AuditResult> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      images,
      sensitivity,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Audit failed");
  }

  return response.json() as Promise<AuditResult>;
}
