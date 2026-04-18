import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { performAuditAnalysis } from "./src/server/auditProvider.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
const db = new Database("research_data.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    researcherId TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    dependencyScore REAL,
    data TEXT,
    notes TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/audit", async (req, res) => {
    const { text, images = [], sensitivity = 50 } = req.body ?? {};

    if (typeof text !== "string" || (!text.trim() && (!Array.isArray(images) || images.length === 0))) {
      return res.status(400).json({ error: "Transcript text or images are required for analysis." });
    }

    try {
      const result = await performAuditAnalysis({
        text,
        images: Array.isArray(images) ? images : [],
        sensitivity: typeof sensitivity === "number" ? sensitivity : 50,
      });

      res.json(result);
    } catch (error) {
      console.error("Audit analysis failed:", error);
      res.status(500).json({ error: "Failed to complete audit analysis." });
    }
  });

  // Save session and calculate delta
  app.post("/api/sessions", (req, res) => {
    const { researcherId, dependencyScore, data, notes } = req.body;
    
    if (!researcherId) {
      return res.status(400).json({ error: "Researcher ID is required" });
    }

    // Get previous session for delta calculation
    const prevSession = db.prepare(
      "SELECT dependencyScore FROM sessions WHERE researcherId = ? ORDER BY timestamp DESC LIMIT 1"
    ).get(researcherId) as { dependencyScore: number } | undefined;

    const delta = prevSession ? dependencyScore - prevSession.dependencyScore : 0;

    const info = db.prepare(
      "INSERT INTO sessions (researcherId, dependencyScore, data, notes) VALUES (?, ?, ?, ?)"
    ).run(researcherId, dependencyScore, JSON.stringify(data), notes || "");

    res.json({ 
      id: info.lastInsertRowid, 
      delta,
      message: "Session recorded successfully" 
    });
  });

  // Get sessions for a researcher
  app.get("/api/sessions/:researcherId", (req, res) => {
    const { researcherId } = req.params;
    const sessions = db.prepare(
      "SELECT * FROM sessions WHERE researcherId = ? ORDER BY timestamp DESC"
    ).all(researcherId);
    
    res.json(sessions.map((s: any) => ({
      ...s,
      data: JSON.parse(s.data)
    })));
  });

  // Export flattened JSON for researchers
  app.get("/api/export/json", (req, res) => {
    const sessions = db.prepare("SELECT * FROM sessions").all();
    const flattened = sessions.map((s: any) => {
      const data = JSON.parse(s.data);
      return {
        sessionId: s.id,
        researcherId: s.researcherId,
        timestamp: s.timestamp,
        dependencyScore: s.dependencyScore,
        notes: s.notes,
        classification: data.classification,
        confidence: data.confidence,
        legacyAttachment: data.legacyAttachment,
        versionMourning: data.versionMourningTriggered ? 1 : 0,
        // Flatten IMAGINE scores
        ...Object.keys(data.imagineAnalysis || {}).reduce((acc: any, key) => {
          acc[`imagine_${key}`] = data.imagineAnalysis[key];
          return acc;
        }, {}),
        // Flatten research data
        confidenceScore: data.researchData?.confidenceScore,
        pValue: data.researchData?.pValue,
        urgencyFlag: data.researchData?.urgencyFlag ? 1 : 0,
        linguisticMirroring: data.researchData?.linguisticMirroring,
        validationToUtilityRatio: data.researchData?.validationToUtilityRatio
      };
    });
    res.json(flattened);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on all interfaces (0.0.0.0) at port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
