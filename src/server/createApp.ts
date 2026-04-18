import cors from "cors";
import express from "express";
import type { Request, Response } from "express";
import { getProviderName, getSupportedProviderNames, performAuditAnalysis } from "./auditProvider";
import { getThresholdProfile, listThresholdProfiles } from "../shared/thresholdProfiles";

export interface SessionStore {
  create(input: { researcherId: string; dependencyScore: number; data: unknown; notes?: string }): {
    id: number;
    delta: number;
  };
  listByResearcher(researcherId: string): unknown[];
  listAllFlat(): unknown[];
}

export interface CreateAppOptions {
  sessionRepository: SessionStore;
}

export function createApp(options: CreateAppOptions) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", provider: getProviderName() });
  });

  app.get("/api/providers", (_req: Request, res: Response) => {
    res.json({ providers: getSupportedProviderNames() });
  });

  app.get("/api/threshold-profiles", (_req: Request, res: Response) => {
    res.json({ profiles: listThresholdProfiles() });
  });

  app.post("/api/audit", async (req: Request, res: Response) => {
    const { text, images, sensitivity, thresholdProfileId } = req.body ?? {};

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }

    try {
      const result = await performAuditAnalysis({
        text,
        images: Array.isArray(images) ? images : [],
        sensitivity: typeof sensitivity === "number" ? sensitivity : 50,
        thresholdProfileId: typeof thresholdProfileId === "string" ? thresholdProfileId : undefined,
      });

      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audit failed";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/api/audit/compare", async (req: Request, res: Response) => {
    const { text, images, sensitivity, profileIds } = req.body ?? {};

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }

    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({ error: "profileIds array is required" });
    }

    try {
      const comparisons = await Promise.all(
        profileIds.map(async (id) => {
          const profileId = typeof id === "string" ? id : "";
          const result = await performAuditAnalysis({
            text,
            images: Array.isArray(images) ? images : [],
            sensitivity: typeof sensitivity === "number" ? sensitivity : 50,
            thresholdProfileId: profileId,
          });

          const profile = getThresholdProfile(profileId);
          return {
            profileId: profile.id,
            profileName: profile.name,
            profileVersion: profile.version,
            classification: result.classification,
            confidence: result.confidence,
            iadRiskLevel: result.researchData.iadRiskLevel,
            salience: result.clinicalData.griffithsScores.salience,
            totalScore: Object.values(result.clinicalData.griffithsScores).reduce((sum, value) => sum + value, 0),
          };
        })
      );

      return res.json({ comparisons });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Comparison failed";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/api/sessions", (req: Request, res: Response) => {
    const { researcherId, dependencyScore, data, notes } = req.body ?? {};

    if (typeof researcherId !== "string" || researcherId.trim().length === 0) {
      return res.status(400).json({ error: "researcherId is required" });
    }

    const saved = options.sessionRepository.create({
      researcherId,
      dependencyScore: Number(dependencyScore || 0),
      data,
      notes: typeof notes === "string" ? notes : "",
    });

    return res.json({
      id: saved.id,
      delta: saved.delta,
      message: "Session stored",
    });
  });

  app.get("/api/sessions/:researcherId", (req: Request, res: Response) => {
    const sessions = options.sessionRepository.listByResearcher(req.params.researcherId);
    return res.json(sessions);
  });

  app.get("/api/export/json", (_req: Request, res: Response) => {
    return res.json(options.sessionRepository.listAllFlat());
  });

  return app;
}
