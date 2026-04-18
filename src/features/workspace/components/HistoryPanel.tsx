import { Database } from "lucide-react";

interface HistoryPanelProps {
  history: Array<Record<string, unknown>>;
}

function getImageCount(item: Record<string, unknown>): number {
  const payload = item.data as Record<string, unknown> | undefined;
  const imageSummary = payload?.imageSummary as { count?: number } | undefined;
  return typeof imageSummary?.count === "number" ? imageSummary.count : 0;
}

function getClassificationLabel(item: Record<string, unknown>): string {
  const payload = item.data as Record<string, unknown> | undefined;
  const label = payload?.classificationLabel;
  const fallback = payload?.classification;
  return typeof label === "string" && label.trim().length > 0
    ? label
    : typeof fallback === "string"
      ? fallback
      : "Unclassified";
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <section className="panel history-panel">
      <h2>
        <Database size={18} /> Session History
      </h2>

      {history.length === 0 && <p className="empty">No stored sessions for this researcher.</p>}

      {history.length > 0 && (
        <ul className="history-list">
          {history.slice(0, 12).map((item, index) => (
            <li key={String(item.id || index)}>
              <div>
                <strong>{String(item.timestamp || "unknown")}</strong>
                <p>{String(item.notes || "No notes")}</p>
                <p>{getImageCount(item)} image attachments</p>
                <p className="history-classification">{getClassificationLabel(item)}</p>
              </div>
              <span className="history-score">{String(item.dependencyScore || 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
