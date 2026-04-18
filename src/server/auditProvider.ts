import type { AuditRequest, AuditResult } from "../shared/auditCore";
import { runLocalAudit } from "../shared/auditCore";

export async function performAuditAnalysis(request: AuditRequest): Promise<AuditResult> {
  return runLocalAudit(request);
}
