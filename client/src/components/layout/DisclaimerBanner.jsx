import { useState } from 'react';

export default function DisclaimerBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-100">
      <div className="container-page flex items-center justify-between gap-3 py-2 text-xs text-amber-800">
        <p>
          <span className="font-semibold">Note:</span> PakLaw Assistant provides general
          legal information, not legal advice. Verify against official sources and consult a
          qualified lawyer for your situation.
        </p>
        <button
          onClick={() => setOpen(false)}
          className="shrink-0 rounded px-2 py-0.5 text-amber-700 hover:bg-amber-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
