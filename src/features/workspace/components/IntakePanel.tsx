import { useState, type ClipboardEvent, type DragEvent } from "react";
import { AlertCircle, FileUp, FlaskConical, Save, Send } from "lucide-react";
import type { ThresholdProfile } from "../../../shared/thresholdProfiles";

interface IntakePanelProps {
  transcript: string;
  setTranscript: (value: string) => void;
  researcherId: string;
  setResearcherId: (value: string) => void;
  sensitivity: number;
  setSensitivity: (value: number) => void;
  notes: string;
  setNotes: (value: string) => void;
  providers: string[];
  thresholdProfiles: ThresholdProfile[];
  selectedProfileId: string;
  setSelectedProfileId: (value: string) => void;
  calibrationProfileIds: string[];
  toggleCalibrationProfile: (profileId: string) => void;
  uploadedImages: Array<{ id: string; name: string; size: number; data: string }>;
  onAddImages: (files: FileList | null) => void;
  onDropImages: (files: FileList | null) => void;
  onPasteImages: (items: DataTransferItemList | null) => void;
  onRemoveImage: (imageId: string) => void;
  error: string | null;
  isRunning: boolean;
  isSaving: boolean;
  isComparing: boolean;
  hasResult: boolean;
  onRunAudit: () => void;
  onRunCalibration: () => void;
  onSaveSession: () => void;
}

export function IntakePanel({
  transcript,
  setTranscript,
  researcherId,
  setResearcherId,
  sensitivity,
  setSensitivity,
  notes,
  setNotes,
  providers,
  thresholdProfiles,
  selectedProfileId,
  setSelectedProfileId,
  calibrationProfileIds,
  toggleCalibrationProfile,
  uploadedImages,
  onAddImages,
  onDropImages,
  onPasteImages,
  onRemoveImage,
  error,
  isRunning,
  isSaving,
  isComparing,
  hasResult,
  onRunAudit,
  onRunCalibration,
  onSaveSession,
}: IntakePanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    void onDropImages(event.dataTransfer.files);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    void onPasteImages(event.clipboardData.items);
  }

  return (
    <section className="panel input-panel">
      <h2>
        <FlaskConical size={18} /> Study Intake
      </h2>

      <label>
        Researcher ID
        <input value={researcherId} onChange={(event) => setResearcherId(event.target.value)} />
      </label>

      <label>
        Sensitivity: {sensitivity}
        <input
          type="range"
          min={0}
          max={100}
          value={sensitivity}
          onChange={(event) => setSensitivity(Number(event.target.value))}
        />
      </label>

      <label>
        Transcript
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={10}
          placeholder="Paste transcript..."
        />
      </label>

      <label>
        Photos And Screenshots
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            onAddImages(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <small className="field-help">Attach context images to enrich scoring and evidence interpretation.</small>
      </label>

      <div
        className={`upload-dropzone${isDragActive ? " upload-dropzone-active" : ""}`}
        tabIndex={0}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        <p>Drop screenshots here or focus this panel and paste from the clipboard.</p>
        <span>PNG, JPEG, WebP, and other browser-supported image formats are accepted.</span>
      </div>

      {uploadedImages.length > 0 && (
        <div className="upload-grid" aria-label="Uploaded screenshots and photos">
          {uploadedImages.map((image) => (
            <figure key={image.id} className="upload-card">
              <img src={image.data} alt={image.name} className="upload-preview" />
              <figcaption>
                <strong>{image.name}</strong>
                <span>{Math.max(1, Math.round(image.size / 1024))} KB</span>
              </figcaption>
              <button type="button" className="btn btn-quiet upload-remove" onClick={() => onRemoveImage(image.id)}>
                Remove
              </button>
            </figure>
          ))}
        </div>
      )}

      <label>
        Analyst Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Optional notes" />
        <small className="field-help">Notes are saved with the session and included in history exports.</small>
      </label>

      <label>
        Threshold Profile
        <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)}>
          {thresholdProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name} ({profile.version})
            </option>
          ))}
        </select>
      </label>

      <div className="calibration-group">
        <p>Calibration Profiles</p>
        {thresholdProfiles.map((profile) => (
          <label key={profile.id} className="calibration-option">
            <input
              type="checkbox"
              checked={calibrationProfileIds.includes(profile.id)}
              onChange={() => toggleCalibrationProfile(profile.id)}
            />
            <span>{profile.name}</span>
          </label>
        ))}
      </div>

      <div className="actions">
        <button onClick={onRunAudit} disabled={isRunning} className="btn btn-primary">
          <Send size={16} /> {isRunning ? "Analyzing..." : "Run Audit"}
        </button>
        <button onClick={onRunCalibration} disabled={isComparing} className="btn btn-quiet">
          <Send size={16} /> {isComparing ? "Calibrating..." : "Run Calibration"}
        </button>
        <button onClick={onSaveSession} disabled={!hasResult || isSaving} className="btn btn-quiet">
          <Save size={16} /> {isSaving ? "Saving..." : "Save Session"}
        </button>
        <button onClick={() => window.open("/api/export/json", "_blank")} className="btn btn-quiet">
          <FileUp size={16} /> Export JSON
        </button>
      </div>

      <div className="meta-block">
        <p>Available providers: {providers.join(", ") || "local"}</p>
        <p>Attached images: {uploadedImages.length}</p>
      </div>

      {error && (
        <div className="error">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </section>
  );
}
