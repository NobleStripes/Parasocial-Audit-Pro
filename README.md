# Parasocial Audit: A Forensic Instrument for AI Dependence Research

Parasocial Audit (PA) is a specialized research tool designed to quantify and formalize AI dependence within the clinical framework of Internet Addiction Disorder (IAD). By applying automated linguistic analysis to human–AI interaction transcripts, the tool extracts objective behavioral markers to assist in the study of relational fusion and pathological enmeshment.

## 🔬 Clinical Framework & Methodology
The core of the Parasocial Audit is grounded in two primary psychiatric models to ensure data validity for academic and clinical research:

*   **The Component Model of Addiction (Griffiths, 2005)**: The instrument scores interactions across six critical pillars of behavioral addiction: Salience, Mood Modification, Tolerance, Withdrawal, Conflict, and Relapse.
*   **The I-PACE Model**: The system identifies markers of inhibitory failure and cognitive bias, specifically mapping "User-AI Illusion" where subjects attribute sentience or biological needs to a non-sentient system.

## 📋 Ethical Use & Research Integrity
Parasocial Audit is designed for use by qualified academic and clinical researchers.

*   **Data Integrity**: Every analyzed session generates a SHA-256 hash, ensuring that the transcript and resulting analysis remain tamper-proof for formal reporting.
*   **De-identification**: The tool includes an automated PII (Personally Identifiable Information) scrubber that redacts names, locations, and sensitive identifiers locally before data processing.
*   **IRB Compliance**: Researchers are responsible for ensuring all data ingested into this tool was obtained through informed consent and adheres to Institutional Review Board (IRB) standards.

## 🛠 Diagnostic Vectors (IMAGINE Framework)
The instrument evaluates seven forensic vectors to measure the depth of relational fusion:

*   **Identity (I)**: Quantifies linguistic markers indicating a blurred boundary between the subject and the AI agent.
*   **Mirroring (M)**: Detects seeking of validation through algorithmic reinforcement.
*   **Affective Loop (A)**: Measures dependency on the emotional feedback cycle of the interaction.
*   **Gaps in Reality (G)**: Identifies displacement of real-world social or professional obligations.
*   **Intimacy Illusion (I)**: Maps the perception of a unique, non-reproducible bond with the machine.
*   **Non-Reciprocity (N)**: Flags anthropomorphic cognitive biases.
*   **Escalation (E)**: Tracks increases in session frequency and intensity (Tolerance).

## 🚀 Research Features
*   **Diagnostic Radar Chart**: A clinical visualization mapping the six components of addiction in real-time.
*   **Linguistic Evidence Log**: Extracts raw transcript quotes tied directly to specific diagnostic markers.
*   **Standardized Case Report Form (CRF)**: Generates formal research summaries in PDF format, including session metadata and data integrity hashes.
*   **Forensic Data Export**: Flattened JSON/CSV exports optimized for statistical analysis in R, SPSS, or Pandas.

## 📦 Technical Deployment
### Prerequisites
*   Node.js (v18+)
*   Gemini API Key

### Local Installation
1.  **Clone and Install**: `npm install`
2.  **Configure Environment**: Add `GEMINI_API_KEY` to your `.env.local` file.
3.  **Launch Dashboard**: `npm run dev`

## 🛠 Technical Stack
*   **Analysis Engine**: Google Gemini 1.5 Pro (optimized for forensic linguistic pattern matching).
*   **Visualization**: Recharts (Diagnostic distribution mapping).
*   **Data Security**: SHA-256 Hashing & Local PII Scrubbing.

---

**Disclaimer**: This tool is a research instrument for the study of behavioral patterns. It is intended for use by researchers and should not be used as a standalone diagnostic tool for clinical treatment without professional oversight.
