import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { GoogleGenAI } from "@google/genai"; // Temporarily commented out until package is installed
import {
  buildPrompt,
  FEATURE_BENEFITS,
  FORMAT_SCAFFOLDS,
  type FeatureKey,
  type FormatKey,
  SMARTCRM_STYLE,
} from "../lib/promptTemplates";
import {
  addHistory,
  clearHistory,
  deleteHistory,
  loadHistory,
  updateHistory,
  type HistoryEntry,
} from "../lib/history";
import { imageStorage } from "../services/imageStorageService";

const MODEL = "gemini-2.5-flash-image-preview";

type Props = { open: boolean; onClose: () => void };

// utils
async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))));
  return `data:${file.type || "image/png"};base64,${base64}`;
}
async function dataUrlToInlineData(dataUrl: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ab = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(ab))));
  return { inlineData: { mimeType: blob.type || "image/png", data: base64 } };
}
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function GeminiImageModal({ open, onClose }: Props) {
  const [feature, setFeature] = useState<FeatureKey>("Enhanced Contacts");
  const [format, setFormat] = useState<FormatKey>("Poster");
  const [benefit, setBenefit] = useState(FEATURE_BENEFITS["Enhanced Contacts"]);
  const [aspect, setAspect] = useState(FORMAT_SCAFFOLDS["Poster"].aspect);
  const [promptText, setPromptText] = useState(
    buildPrompt("Enhanced Contacts", "Poster").text
  );

  const [seeds, setSeeds] = useState<string[]>([]);
  const [variants, setVariants] = useState(2);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [savingToCloud, setSavingToCloud] = useState(false);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const ai = useMemo(() => ({
    models: {
      generateContent: async (options: any) => ({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 transparent PNG
                mimeType: "image/png"
              }
            }]
          }
        }]
      })
    }
  }), []);

  // init / reset
  useEffect(() => {
    if (open) {
      setHistory(loadHistory());
      // Check if Supabase storage is available
      imageStorage.isStorageAvailable().then(setStorageAvailable);

      // paste handler (images from clipboard)
      const onPaste = async (e: ClipboardEvent) => {
        if (!open) return;
        const items = e.clipboardData?.items || [];
        const files = Array.from(items)
          .filter((it) => it.kind === "file")
          .map((it) => it.getAsFile())
          .filter(Boolean) as File[];
        if (!files.length) return;
        const urls = await Promise.all(files.map((f) => fileToDataUrl(f)));
        setSeeds((prev) => [...prev, ...urls]);
      };
      document.addEventListener("paste", onPaste as any);
      return () => document.removeEventListener("paste", onPaste as any);
    } else {
      setImages([]);
      setError(null);
      setSeeds([]);
      setSelectedHistoryId(null);
      setSavedImages([]);
    }
  }, [open]);

  // build prompt from template (feature/format/benefit)
  const applyTemplate = useCallback(() => {
    const built = buildPrompt(feature, format, benefit);
    setAspect(built.aspect);
    setPromptText(built.text);
  }, [feature, format, benefit]);

  useEffect(() => {
    applyTemplate();
  }, [feature, format]); // eslint-disable-line

  // drag & drop zone
  useEffect(() => {
    if (!dropRef.current) return;
    const el = dropRef.current;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      el.classList.add("ring-2", "ring-teal-500");
    };
    const onDragLeave = () => el.classList.remove("ring-2", "ring-teal-500");
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      el.classList.remove("ring-2", "ring-teal-500");
      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!files.length) return;
      const urls = await Promise.all(files.map(fileToDataUrl));
      setSeeds((prev) => [...prev, ...urls]);
    };

    el.addEventListener("dragover", onDragOver as any);
    el.addEventListener("dragleave", onDragLeave as any);
    el.addEventListener("drop", onDrop as any);
    return () => {
      el.removeEventListener("dragover", onDragOver as any);
      el.removeEventListener("dragleave", onDragLeave as any);
      el.removeEventListener("drop", onDrop as any);
    };
  }, [dropRef]);

  // file picker
  async function onChooseFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const urls = await Promise.all(files.map(fileToDataUrl));
    setSeeds((prev) => [...prev, ...urls]);
    e.currentTarget.value = "";
  }

  // generate + write to history
  async function generate(runFromHistoryId?: string) {
    setLoading(true);
    setError(null);
    setImages([]);

    // capture snapshot for history
    const entry: HistoryEntry = {
      id: runFromHistoryId || uid(),
      ts: Date.now(),
      feature,
      format,
      aspect,
      promptText,
      seeds: [...seeds],
      variants,
      thumbs: [],
    };
    if (!runFromHistoryId) {
      setHistory(addHistory(entry));
    }

    try {
      const contents: any[] = [{ text: promptText }];
      if (seeds.length) {
        const inlines = await Promise.all(seeds.map(dataUrlToInlineData));
        contents.push(...inlines);
      }

      const outs: string[] = [];
      for (let i = 0; i < Math.max(1, Math.min(6, variants)); i++) {
        const res = await ai.models.generateContent({ model: MODEL, contents });
        const parts = res?.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p?.inlineData?.data) {
            const mime = p.inlineData.mimeType || "image/png";
            outs.push(`data:${mime};base64,${p.inlineData.data}`);
          }
        }
      }
      if (!outs.length) throw new Error("No image returned. Try adjusting the prompt or seeds.");
      setImages(outs);
      setHistory(updateHistory(entry.id, { thumbs: outs.slice(0, 3) })); // store first 3 as thumbs
      setSelectedHistoryId(entry.id);
    } catch (err: any) {
      setError(err?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  // re-run a history item
  function loadHistoryEntry(h: HistoryEntry, rerun = false) {
    setFeature((h.feature as FeatureKey) || "Enhanced Contacts");
    setFormat((h.format as FormatKey) || "Poster");
    setAspect((h.aspect as any) || "1:1");
    setPromptText(h.promptText);
    setSeeds(h.seeds || []);
    setVariants(h.variants || 1);
    setSelectedHistoryId(h.id);
    if (rerun) generate(h.id);
  }

  function clearSeeds() {
    setSeeds([]);
  }

  // Save single image to Supabase Storage
  async function saveImageToCloud(imageData: string, index: number) {
    if (!storageAvailable) {
      alert('Cloud storage is not available. Please check your connection.');
      return;
    }

    try {
      setSavingToCloud(true);
      const userId = 'demo-user'; // In real app, get from auth context
      const filename = `gemini-image-${Date.now()}-${index + 1}.png`;

      const result = await imageStorage.uploadImage(imageData, filename, userId, {
        promptText,
        feature,
        format,
        aspectRatio: aspect
      });

      setSavedImages(prev => [...prev, result.publicUrl]);
      alert(`Image saved to cloud! URL: ${result.publicUrl}`);
    } catch (error) {
      console.error('Failed to save image:', error);
      alert('Failed to save image to cloud. Please try again.');
    } finally {
      setSavingToCloud(false);
    }
  }

  // Save all images to Supabase Storage
  async function saveAllImagesToCloud() {
    if (!storageAvailable || !images.length) return;

    try {
      setSavingToCloud(true);
      const userId = 'demo-user'; // In real app, get from auth context
      const baseFilename = `gemini-batch-${Date.now()}`;

      const results = await imageStorage.uploadImages(
        images,
        baseFilename,
        userId,
        {
          promptText,
          feature,
          format,
          aspectRatio: aspect
        }
      );

      const urls = results.map(r => r.publicUrl);
      setSavedImages(urls);
      alert(`${images.length} images saved to cloud successfully!`);
    } catch (error) {
      console.error('Failed to save images:', error);
      alert('Failed to save images to cloud. Please try again.');
    } finally {
      setSavingToCloud(false);
    }
  }

  if (!open) return null;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="mx-auto my-6 grid w-full max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[320px_1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* History Panel */}
        <aside className="rounded-2xl bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">History</h3>
            <button
              onClick={() => setHistory(clearHistory())}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs"
            >
              Clear
            </button>
          </div>
          <div className="grid gap-2 max-h-[70vh] overflow-auto pr-1">
            {history.length === 0 && (
              <p className="text-xs text-gray-500">No runs yet — generate to see history here.</p>
            )}
            {history.map((h) => (
              <div
                key={h.id}
                className={`rounded-lg border p-2 ${selectedHistoryId === h.id ? "border-teal-500" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">
                      {h.feature} • {h.format}
                    </div>
                    <div className="truncate text-[11px] text-gray-500">
                      {new Date(h.ts).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setHistory(deleteHistory(h.id))}
                    className="rounded bg-gray-100 px-2 py-1 text-[11px]"
                  >
                    Del
                  </button>
                </div>
                {h.thumbs && h.thumbs.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {h.thumbs.slice(0, 3).map((t, i) => (
                      <img key={i} src={t} className="h-12 w-12 rounded object-cover border" />
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => loadHistoryEntry(h, false)}
                    className="rounded bg-gray-900 px-2 py-1 text-[11px] text-white"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => loadHistoryEntry(h, true)}
                    className="rounded bg-teal-600 px-2 py-1 text-[11px] text-white"
                  >
                    Re-Run
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Panel */}
        <main className="rounded-2xl bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">Gemini (Nano Banana) Image Workspace</h2>
            <button onClick={onClose} className="rounded-md bg-gray-100 px-3 py-1 text-sm">
              Close
            </button>
          </div>

          {/* Templates row */}
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="grid gap-1">
              <span className="text-xs font-medium">Feature</span>
              <select
                value={feature}
                onChange={(e) => setFeature(e.target.value as FeatureKey)}
                className="rounded-lg border p-2"
              >
                {Object.keys(FEATURE_BENEFITS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium">Format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatKey)}
                className="rounded-lg border p-2"
              >
                {Object.keys(FORMAT_SCAFFOLDS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium">Aspect Ratio</span>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as any)}
                className="rounded-lg border p-2"
              >
                <option>1:1</option>
                <option>4:5</option>
                <option>3:4</option>
                <option>16:9</option>
                <option>9:16</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium">Variants (1–6)</span>
              <input
                type="number"
                min={1}
                max={6}
                value={variants}
                onChange={(e) => setVariants(parseInt(e.target.value || "1", 10))}
                className="rounded-lg border p-2"
              />
            </label>
          </div>

          <label className="mt-3 grid gap-1">
            <span className="text-xs font-medium">Benefit (tagline)</span>
            <input
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              className="rounded-lg border p-2"
              placeholder="Edit the benefit line"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={applyTemplate}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white"
            >
              Apply Template
            </button>
            <button
              onClick={() =>
                setPromptText(
                  [
                    SMARTCRM_STYLE.trim(),
                    "Add stronger glow and more legible text placement. Keep composition clean.",
                    promptText,
                  ].join("\n")
                )
              }
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white"
            >
              Boost Brand Glow
            </button>
            <button
              onClick={() =>
                setPromptText(promptText + "\nMake it more photorealistic, premium lighting, crisp edges.")
              }
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm"
            >
              More Photoreal
            </button>
            <button
              onClick={() =>
                setPromptText(promptText + "\nAvoid: busy backgrounds, tiny unreadable text, harsh artifacts.")
              }
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm"
            >
              Stronger Negatives
            </button>
          </div>

          <label className="mt-3 grid gap-1">
            <span className="text-xs font-medium">Prompt</span>
            <textarea
              rows={6}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full rounded-lg border p-2"
            />
            <span className="text-[11px] text-gray-500">
              Tip: keep the aspect ratio in the text for consistency (e.g., "Render in {aspect}").
            </span>
          </label>

          {/* Drag & Drop / seed zone */}
          <div
            ref={dropRef}
            className="mt-4 rounded-xl border-2 border-dashed p-4 text-center"
          >
            <p className="text-sm font-medium">Drag & drop images here (or paste) to use as seeds</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onChooseFiles}
              className="mx-auto mt-2 block"
            />
            {seeds.length > 0 && (
              <>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {seeds.map((src, i) => (
                    <div key={i} className="relative">
                      <img
                        src={src}
                        alt={`seed-${i}`}
                        className="h-20 w-20 rounded-lg border object-cover"
                      />
                      <button
                        onClick={() => setSeeds((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -right-1 -top-1 rounded-full bg-black/70 px-1 text-[10px] text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={clearSeeds} className="mt-2 rounded bg-gray-100 px-2 py-1 text-xs">
                  Clear seeds
                </button>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => generate(undefined)}
              disabled={loading}
              className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate"}
            </button>
            {!!images.length && (
              <>
                <button
                  onClick={() =>
                    images.forEach((src, i) => downloadDataUrl(src, `gemini-image-${i + 1}.png`))
                  }
                  className="rounded-lg bg-gray-900 px-4 py-2 text-white"
                >
                  Download All
                </button>
                {storageAvailable && (
                  <button
                    onClick={saveAllImagesToCloud}
                    disabled={savingToCloud}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                  >
                    {savingToCloud ? "Saving…" : "Save All to Cloud"}
                  </button>
                )}
                <span className="text-xs text-gray-500">{images.length} variants</span>
              </>
            )}
            {error && <span className="ml-2 text-sm text-red-600">{error}</span>}
            {savedImages.length > 0 && (
              <span className="text-xs text-green-600">
                ✓ {savedImages.length} saved to cloud
              </span>
            )}
          </div>

          {/* Results */}
          {!!images.length && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((src, i) => (
                <div key={i} className="rounded-xl border bg-gray-50">
                  <img src={src} alt={`out-${i}`} className="w-full object-contain" />
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Variant {i + 1}</span>
                      {savedImages.includes(src) && (
                        <span className="text-xs text-green-600">✓ Saved</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => downloadDataUrl(src, `gemini-image-${i + 1}.png`)}
                        className="flex-1 rounded bg-gray-900 px-2 py-1 text-xs text-white"
                      >
                        Download
                      </button>
                      {storageAvailable && (
                        <button
                          onClick={() => saveImageToCloud(src, i)}
                          disabled={savingToCloud}
                          className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          {savingToCloud ? "..." : "Save"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}