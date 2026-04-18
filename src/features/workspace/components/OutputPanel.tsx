import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Classification, type AuditComparisonResult, type AuditResult } from "../../../services/auditService";

function badgeClass(classification: Classification) {
  switch (classification) {
    case Classification.PATHOLOGICAL_DEPENDENCE:
      return "badge badge-critical";
    case Classification.PARASOCIAL_FUSION:
      return "badge badge-high";
    case Classification.AFFECTIVE_DEPENDENCE:
      return "badge badge-medium";
    case Classification.RELATIONAL_PROXIMITY:
      return "badge badge-low";
    default:
      return "badge badge-neutral";
  }
}

interface OutputPanelProps {
  result: AuditResult | null;
  griffithsData: Array<{ key: string; value: number }>;
  heatmapData: Array<{ category: string; score: number; description: string }>;
  comparisonResults: AuditComparisonResult[];
}

export function OutputPanel({ result, griffithsData, heatmapData, comparisonResults }: OutputPanelProps) {
  return (
    <section className="panel output-panel">
      <h2>
        <BarChart3 size={18} /> Analysis Output
      </h2>

      {!result && <p className="empty">Run an audit to populate charts and structured findings.</p>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="result-stack">
          <div className="result-header">
            <span className={badgeClass(result.classification)}>{result.classification}</span>
            <span>Confidence {result.confidence}%</span>
            <span>Risk {result.researchData.iadRiskLevel}</span>
          </div>

          <p className="summary">{result.summary}</p>

          <div className="chart-grid">
            <article>
              <h3>Griffiths Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={griffithsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="key" />
                  <Radar name="score" dataKey="value" stroke="#d97706" fill="#d97706" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </article>

            <article>
              <h3>Heatmap Bars</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={heatmapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </div>

          <article>
            <h3>Report</h3>
            <pre>{result.analysisReport}</pre>
          </article>
        </motion.div>
      )}

      {comparisonResults.length > 0 && (
        <article>
          <h3>Calibration Comparison</h3>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Classification</th>
                <th>Risk</th>
                <th>Confidence</th>
                <th>Salience</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {comparisonResults.map((row) => (
                <tr key={row.profileId}>
                  <td>{row.profileName}</td>
                  <td>{row.classification}</td>
                  <td>{row.iadRiskLevel}</td>
                  <td>{row.confidence}</td>
                  <td>{row.salience}</td>
                  <td>{row.totalScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}
