import { useState } from "react";
import GeminiImageModal from "./GeminiImageModal";

export default function TestGeminiModal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold"
      >
        Open SmartCRM Image Workspace
      </button>
      <GeminiImageModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}