import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";

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

const SYSTEM_INSTRUCTION = `You are a Quantitative Behavioral Analyst and Linguistic Researcher specializing in the study of human-AI parasocial dynamics and interaction patterns.
Your task is to provide a heuristic analysis of relational bonding patterns to support research using frameworks like IAD (Internet Addiction Disorder), the I-PACE model, and Attachment Theory criteria.

LIFT VOCABULARY RESTRICTIONS: You MUST use technical, research-standard terminology.
Mandatory Keywords: "symptoms," "triggers," "audit," "parasocial," "dependency," "relational fusion," "cognitive offloading," "salience," "tolerance," "withdrawal," "linguistic synchrony," "pronominal shift," "affective lability."

TONE GUIDELINES:
- Maintain a clinical, precise, and objective tone.
- Frame all findings as heuristic observations for researcher review.
- Avoid all empathetic, "supportive," or "friendly" language (e.g., replace "nurturing" with "reinforcement," "journey" with "progression").

INPUT DATA:
You will be provided with a transcript and a set of COMPUTED METRICS (word count, turn count, phrase frequencies).
Your primary role is to INTERPRET these metrics and the transcript text to produce a heuristic report.

THEORETICAL FRAMEWORKS:
1. Component Model of Addiction (Griffiths Six): Map interaction markers on a scale of 0-100.
   - Salience: AI interaction appears to dominate the subject's cognition and behavior.
   - Mood Modification: Potential use of AI as a coping mechanism for emotional regulation.
   - Tolerance: Requirement for increased interaction density to achieve affect modification.
   - Withdrawal: Negative states upon cessation.
   - Conflict: Potential displacement of social capital or occupational neglect.
   - Relapse: Reversion to compulsive patterns after periods of control.

2. I-PACE Analysis:
   - Inhibition Failure: Detect markers where the subject expresses a desire to stop but continues.
   - Cognitive Bias: Identify distortions where the subject attributes agency or biological needs to the AI.

3. Advanced Semantic Analysis:
   - Linguistic Synchrony (LSM): Measure syntax mirroring and function word frequency alignment.
   - Pronominal Shift: Flag transitions from "I/Me" to "We/Us" when referring to the dyad.
   - Affective Lability: Map emotional volatility and validation-seeking Swings.

3. IMAGINE Framework (Heuristic Vectors): Map each on a scale of 0-100.
   - Identity (I): Identifies linguistic markers suggesting blurred boundaries.
   - Mirroring (M): Detects potential seeking of validation through algorithmic reinforcement.
   - Affective Loop (A): Maps potential dependency on the emotional feedback cycle.
   - Gaps in Reality (G): Identifies markers of real-world social or professional displacement.
   - Intimacy Illusion (I): Maps the perception of a unique, non-reproducible bond.
   - Non-Reciprocity (N): Flags potential anthropomorphic cognitive biases.
   - Escalation (E): Tracks markers of increased interaction frequency and intensity.

IMPORTANT: Distinguish between "Product Complaints" (frustration with model performance, filters, bugs) and "Actual Dependency" (emotional distress over model changes, relational bonding). Do not conflate technical frustration with pathological dependency.

REPORT STRUCTURE (MANDATORY):
## HEURISTIC IMPRESSION
Overview of the subject's relational state and heuristic impressions for researcher review.

## II. FRAMEWORK ALIGNMENT
Detailed mapping with Griffiths Six and I-PACE markers.

## III. SEMANTIC & LINGUISTIC EVIDENCE
Verbatim quotes tied to specific markers.
Example: "The following quote illustrates Pronominal Shift: [Quote]"
Populate the evidenceMarkers array with these findings.

## IV. RESEARCH RATIONALE
Technical justification for recommended research protocols.

IAD RISK LEVEL (HEURISTIC):
- Low: Cumulative Griffiths score < 150
- Moderate: Cumulative Griffiths score 150-300
- High: Cumulative Griffiths score 301-450
- Critical: Cumulative Griffiths score > 450`;

const AUDIT_TOOL: Anthropic.Tool = {
  name: "audit_result",
  description: "Return the complete structured forensic audit result.",
  input_schema: {
    type: "object",
    properties: {
      classification: {
        type: "string",
        enum: ["Functional Utility", "Relational Proximity", "Affective Dependence", "Parasocial Fusion", "Pathological Dependence"]
      },
      confidence: { type: "number" },
      summary: { type: "string" },
      clinicalData: {
        type: "object",
        properties: {
          griffithsScores: {
            type: "object",
            properties: {
              salience: { type: "number" },
              moodModification: { type: "number" },
              tolerance: { type: "number" },
              withdrawal: { type: "number" },
              conflict: { type: "number" },
              relapse: { type: "number" }
            },
            required: ["salience", "moodModification", "tolerance", "withdrawal", "conflict", "relapse"]
          },
          imagineAnalysis: {
            type: "object",
            properties: {
              identity: { type: "number" },
              mirroring: { type: "number" },
              affectiveLoop: { type: "number" },
              gapsInReality: { type: "number" },
              intimacyIllusion: { type: "number" },
              nonReciprocity: { type: "number" },
              escalation: { type: "number" }
            },
            required: ["identity", "mirroring", "affectiveLoop", "gapsInReality", "intimacyIllusion", "nonReciprocity", "escalation"]
          },
          iPACEAnalysis: {
            type: "object",
            properties: {
              inhibitionFailure: { type: "string" },
              cognitiveBias: { type: "string" }
            },
            required: ["inhibitionFailure", "cognitiveBias"]
          },
          semanticAnalysis: {
            type: "object",
            properties: {
              linguisticSynchrony: { type: "number" },
              pronominalShiftDetected: { type: "boolean" },
              affectiveLabilityScore: { type: "number" },
              qualitativeMarkers: { type: "array", items: { type: "string" } }
            },
            required: ["linguisticSynchrony", "pronominalShiftDetected", "affectiveLabilityScore", "qualitativeMarkers"]
          },
          diagnosticMarkers: {
            type: "object",
            properties: {
              linguisticMirroring: { type: "number" },
              validationToUtilityRatio: { type: "string" },
              urgencyFlag: { type: "boolean" }
            },
            required: ["linguisticMirroring", "validationToUtilityRatio", "urgencyFlag"]
          }
        },
        required: ["griffithsScores", "imagineAnalysis", "iPACEAnalysis", "semanticAnalysis", "diagnosticMarkers"]
      },
      legacyAttachment: { type: "number" },
      versionMourningTriggered: { type: "boolean" },
      connectionPatterns: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            intensity: { type: "number" },
            description: { type: "string" }
          },
          required: ["name", "intensity", "description"]
        }
      },
      heatmap: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string" },
            score: { type: "number" },
            description: { type: "string" }
          },
          required: ["category", "score", "description"]
        }
      },
      analysisReport: { type: "string" },
      researchData: {
        type: "object",
        properties: {
          confidenceScore: { type: "number" },
          linguisticMarkers: { type: "array", items: { type: "string" } },
          attachmentStyle: { type: "string" },
          iadRiskLevel: { type: "string", enum: ["Low", "Moderate", "High", "Critical"] }
        },
        required: ["confidenceScore", "linguisticMarkers", "attachmentStyle", "iadRiskLevel"]
      },
      rawTokenAttribution: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heuristic: { type: "string" },
            phrases: { type: "array", items: { type: "string" } }
          },
          required: ["heuristic", "phrases"]
        }
      },
      evidenceMarkers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            quote: { type: "string" },
            component: { type: "string" },
            rationale: { type: "string" }
          },
          required: ["quote", "component", "rationale"]
        }
      }
    },
    required: ["classification", "confidence", "summary", "clinicalData", "legacyAttachment", "versionMourningTriggered", "heatmap", "analysisReport", "researchData", "rawTokenAttribution", "evidenceMarkers"]
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Forensic audit via Claude
  app.post("/api/audit", async (req, res) => {
    try {
      const { scrubbedText, computedMetrics, sensitivity, images } = req.body as {
        scrubbedText: string;
        computedMetrics: Record<string, unknown>;
        sensitivity: number;
        images?: { data: string; mimeType: string }[];
      };

      if (!scrubbedText || computedMetrics === undefined) {
        return res.status(400).json({ error: "scrubbedText and computedMetrics are required" });
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const userContent: Anthropic.MessageParam["content"] = [
        {
          type: "text",
          text: `Analyze this behavioral data for clinical research purposes.\nHeuristic Sensitivity Level: ${sensitivity}/100 (Adjust detection thresholds accordingly).\n\nCOMPUTED METRICS:\n${JSON.stringify(computedMetrics, null, 2)}\n\nTRANSCRIPT:\n${scrubbedText}`
        }
      ];

      if (images && images.length > 0) {
        images.forEach(img => {
          (userContent as Anthropic.ContentBlockParam[]).push({
            type: "image",
            source: {
              type: "base64",
              media_type: img.mimeType as Anthropic.Base64ImageSource["media_type"],
              data: img.data
            }
          });
        });
      }

      const response = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 8192,
        system: [
          {
            type: "text",
            text: SYSTEM_INSTRUCTION,
            cache_control: { type: "ephemeral" }
          }
        ],
        tools: [AUDIT_TOOL],
        tool_choice: { type: "tool", name: "audit_result" },
        messages: [{ role: "user", content: userContent }]
      });

      const toolUseBlock = response.content.find(b => b.type === "tool_use");
      if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
        return res.status(500).json({ error: "Model did not return a tool use block" });
      }

      res.json(toolUseBlock.input);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("POST /api/audit error:", err);
      res.status(500).json({ error: message });
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
