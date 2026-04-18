import { useEffect, useMemo, useState } from "react";
import {
  compareAuditProfiles,
  listThresholdProfiles,
  listProviders,
  listSessions,
  performForensicAudit,
  saveSession,
  type AuditImage,
  type AuditComparisonResult,
  type AuditResult,
} from "../../../services/auditService";
import type { ThresholdProfile } from "../../../shared/thresholdProfiles";

const EMPTY_TEXT = `Example:\n[User] I miss how you used to talk to me before the last update.`;
const MAX_IMAGE_COUNT = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024;

export interface UploadedAuditImage extends AuditImage {
  id: string;
  name: string;
  size: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function collectImageFiles(files: Iterable<File>): File[] {
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

export function useAuditWorkspace() {
  const [transcript, setTranscript] = useState(EMPTY_TEXT);
  const [researcherId, setResearcherId] = useState("researcher-01");
  const [notes, setNotes] = useState("");
  const [sensitivity, setSensitivity] = useState(50);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [thresholdProfiles, setThresholdProfiles] = useState<ThresholdProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("default-v2");
  const [calibrationProfileIds, setCalibrationProfileIds] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<AuditComparisonResult[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedAuditImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    void listProviders().then(setProviders).catch(() => setProviders(["local"]));
    void listThresholdProfiles()
      .then((profiles) => {
        setThresholdProfiles(profiles);
        if (profiles.length > 0) {
          setSelectedProfileId(profiles[0].id);
          setCalibrationProfileIds(profiles.map((profile) => profile.id));
        }
      })
      .catch(() => {
        setThresholdProfiles([]);
      });
  }, []);

  useEffect(() => {
    if (!researcherId.trim()) return;
    void listSessions(researcherId)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [researcherId]);

  const griffithsData = useMemo(() => {
    if (!result) return [];
    const g = result.clinicalData.griffithsScores;
    return [
      { key: "Salience", value: g.salience },
      { key: "Mood", value: g.moodModification },
      { key: "Tolerance", value: g.tolerance },
      { key: "Withdrawal", value: g.withdrawal },
      { key: "Conflict", value: g.conflict },
      { key: "Relapse", value: g.relapse },
    ];
  }, [result]);

  const heatmapData = useMemo(() => result?.heatmap || [], [result]);

  async function addImagesFromFiles(files: File[]) {
    if (files.length === 0) return;

    const nextFiles = files;

    if (uploadedImages.length + nextFiles.length > MAX_IMAGE_COUNT) {
      setError(`You can upload up to ${MAX_IMAGE_COUNT} images per audit.`);
      return;
    }

    const invalidType = nextFiles.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      setError(`${invalidType.name} is not a supported image file.`);
      return;
    }

    const oversized = nextFiles.find((file) => file.size > MAX_IMAGE_BYTES);
    if (oversized) {
      setError(`${oversized.name} exceeds the 4 MB per-image limit.`);
      return;
    }

    const totalBytes = uploadedImages.reduce((sum, image) => sum + image.size, 0) + nextFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
      setError("Selected images exceed the 12 MB total upload limit.");
      return;
    }

    try {
      const encoded = await Promise.all(
        nextFiles.map(async (file, index) => ({
          id: `${file.name}-${file.lastModified}-${uploadedImages.length + index}`,
          name: file.name,
          size: file.size,
          mimeType: file.type || "image/png",
          data: await readFileAsDataUrl(file),
        }))
      );

      setUploadedImages((current) => [...current, ...encoded]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load selected images.");
    }
  }

  async function addImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    await addImagesFromFiles(Array.from(files));
  }

  async function addDroppedImages(files: FileList | null) {
    if (!files) return;
    await addImagesFromFiles(collectImageFiles(files));
  }

  async function addClipboardImages(items: DataTransferItemList | null) {
    if (!items) return;
    const clipboardFiles = collectImageFiles(
      Array.from(items)
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file))
    );
    await addImagesFromFiles(clipboardFiles);
  }

  function removeImage(imageId: string) {
    setUploadedImages((current) => current.filter((image) => image.id !== imageId));
  }

  async function runAudit() {
    if (!transcript.trim()) {
      setError("Transcript is required.");
      return;
    }

    setError(null);
    setIsRunning(true);

    try {
      const next = await performForensicAudit(transcript, uploadedImages, sensitivity, selectedProfileId);
      setResult(next);
      setComparisonResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit.");
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  }

  async function runCalibration() {
    if (!transcript.trim()) {
      setError("Transcript is required.");
      return;
    }

    if (calibrationProfileIds.length === 0) {
      setError("Select at least one profile for calibration.");
      return;
    }

    setError(null);
    setIsComparing(true);

    try {
      const comparisons = await compareAuditProfiles(transcript, calibrationProfileIds, uploadedImages, sensitivity);
      setComparisonResults(comparisons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run calibration.");
      setComparisonResults([]);
    } finally {
      setIsComparing(false);
    }
  }

  function toggleCalibrationProfile(profileId: string) {
    setCalibrationProfileIds((current) => {
      if (current.includes(profileId)) {
        return current.filter((id) => id !== profileId);
      }
      return [...current, profileId];
    });
  }

  async function saveCurrentSession() {
    if (!result) return;
    if (!researcherId.trim()) {
      setError("Researcher ID is required to save.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await saveSession({
        researcherId,
        dependencyScore: result.clinicalData.griffithsScores.salience,
        data: result,
        notes,
      });

      const nextHistory = await listSessions(researcherId);
      setHistory(nextHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  }

  return {
    transcript,
    setTranscript,
    researcherId,
    setResearcherId,
    notes,
    setNotes,
    sensitivity,
    setSensitivity,
    result,
    history,
    providers,
    thresholdProfiles,
    selectedProfileId,
    setSelectedProfileId,
    calibrationProfileIds,
    toggleCalibrationProfile,
    uploadedImages,
    addImages,
    addDroppedImages,
    addClipboardImages,
    removeImage,
    comparisonResults,
    error,
    isRunning,
    isSaving,
    isComparing,
    griffithsData,
    heatmapData,
    runAudit,
    runCalibration,
    saveCurrentSession,
  };
}
