"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STEPS = [
  { title: "Enter your idea", body: "Describe the prompt you want in one line, or pick an example template." },
  { title: "Generate", body: "Choose a provider and click Generate. Output streams in real time." },
  { title: "Refine & export", body: "Refine the output, preview structured sections, copy for Cursor, or export to Word." },
  { title: "History & share", body: "All generations are saved. Share read-only links or revisit from History." },
];

export function OnboardingTour() {
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!localStorage.getItem("mp-tour-done")) setStep(0);
  }, []);

  if (step < 0) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function close() {
    localStorage.setItem("mp-tour-done", "1");
    setStep(-1);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-labelledby="tour-title">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative w-full max-w-md animate-modal-in rounded-[14px] border border-border bg-surface p-6 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs text-muted-fg">Step {step + 1} of {STEPS.length}</p>
          <button type="button" onClick={close} className="cursor-pointer text-muted-fg hover:text-foreground" aria-label="Close tour">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="tour-title" className="mb-2 text-lg font-semibold">{current.title}</h2>
        <p className="mb-6 text-sm text-muted-fg">{current.body}</p>
        <div className="flex justify-between gap-2">
          <button type="button" onClick={close} className="btn-ghost cursor-pointer text-sm">Skip</button>
          <button
            type="button"
            onClick={() => (isLast ? close() : setStep(step + 1))}
            className="btn-primary cursor-pointer !w-auto px-6"
          >
            {isLast ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
