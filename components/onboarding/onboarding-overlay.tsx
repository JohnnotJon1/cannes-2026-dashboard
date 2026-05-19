"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  Lock,
  Users,
  Wand2,
  ListChecks,
} from "lucide-react";
import {
  STORAGE_KEYS,
  useLocalStorage,
} from "@/lib/storage";
import { EMPTY_PROFILE, type UserProfile } from "@/types";

// Full-screen first-visit onboarding. Photographic Croisette background,
// white content card, big Fraunces headlines, restrained motion.
//
// Simplified 3-step flow (no integrations to connect):
//   intro  → "Here's what this does" (3 bullets)
//   profile → save the 6 RSVP fields
//   done    → "you're set"
//
// Profile data is persisted in the same localStorage key the rest of the
// app reads from, so it's already integrated on the dashboard.

type StepId = "intro" | "profile" | "done";
const ORDERED_STEPS: StepId[] = ["intro", "profile", "done"];
const INDICATED_STEPS: StepId[] = ["intro", "profile"];

export function OnboardingOverlay() {
  const [completed, setCompleted, hydrated] = useLocalStorage<boolean>(
    STORAGE_KEYS.onboardingCompleted,
    false
  );
  const [step, setStep] = useState<StepId>("intro");
  const [warnOpen, setWarnOpen] = useState(false);

  if (!hydrated || completed) return null;

  const stepIndex = ORDERED_STEPS.indexOf(step);
  const indicatorIndex = INDICATED_STEPS.indexOf(step);
  const finish = () => setCompleted(true);
  const next = () => {
    const i = ORDERED_STEPS.indexOf(step);
    if (i < ORDERED_STEPS.length - 1) setStep(ORDERED_STEPS[i + 1]);
    else finish();
  };
  const back = () => {
    const i = ORDERED_STEPS.indexOf(step);
    if (i > 0) setStep(ORDERED_STEPS[i - 1]);
  };
  const askToSkip = () => setWarnOpen(true);
  const confirmSkip = () => {
    setWarnOpen(false);
    finish();
  };
  const goToProfileStep = () => {
    setWarnOpen(false);
    setStep("profile");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-10">
      {/* Photographic backdrop. Aerial Croisette. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/walkthrough-bg.jpg)" }}
        aria-hidden
      />
      {/* Legibility scrim. Dark at top and bottom for chrome, lighter in the
          middle so the card glows against the picture. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,46,44,0.55)_0%,rgba(10,46,44,0.18)_30%,rgba(10,46,44,0.18)_70%,rgba(10,46,44,0.55)_100%)]"
        aria-hidden
      />

      <div className="absolute left-0 right-0 top-0 z-10 flex items-center px-5 py-4 text-sand-100 sm:px-8 sm:py-5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-100 text-teal-900 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.4)]">
          <span className="font-display text-base font-semibold leading-none">C</span>
        </span>
      </div>

      <div className="relative z-10 mt-12 w-full max-w-2xl rounded-[28px] border border-white/10 bg-sand-50 shadow-[0_30px_90px_-20px_rgba(10,46,44,0.7)] sm:mt-0">
        <StepShell
          step={step}
          indicatorIndex={indicatorIndex}
          totalIndicated={INDICATED_STEPS.length}
          back={back}
          showBack={stepIndex > 0 && step !== "done"}
        >
          {step === "intro" && (
            <IntroStep onContinue={next} onSkipAll={askToSkip} />
          )}
          {step === "profile" && (
            <ProfileStep onContinue={next} onSkip={askToSkip} />
          )}
          {step === "done" && <DoneStep onFinish={finish} />}
        </StepShell>
      </div>

      {warnOpen && (
        <SkipWarningModal
          onSetUpNow={goToProfileStep}
          onConfirmSkip={confirmSkip}
          onCancel={() => setWarnOpen(false)}
        />
      )}
    </div>
  );
}

// ----- Shared step shell ----------------------------------------------------

function StepShell({
  step,
  indicatorIndex,
  totalIndicated,
  back,
  showBack,
  children,
}: {
  step: StepId;
  indicatorIndex: number;
  totalIndicated: number;
  back: () => void;
  showBack: boolean;
  children: React.ReactNode;
}) {
  const showHeader = step !== "done";
  return (
    <div className="px-6 py-8 sm:px-10 sm:py-10">
      {showHeader && (
        <div className="mb-7 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-16 shrink-0">
              {showBack && (
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-medium text-[color:var(--ink-soft)] hover:bg-sand-100 hover:text-teal-900"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
            </div>
            <div className="flex flex-1 items-center gap-1.5" aria-hidden>
              {Array.from({ length: totalIndicated }).map((_, i) => {
                const filled = i <= indicatorIndex;
                return (
                  <span
                    key={i}
                    className={[
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      filled ? "bg-teal-800" : "bg-sand-200",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Step {indicatorIndex + 1} of {totalIndicated}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// ----- Step 1: Intro --------------------------------------------------------

function IntroStep({
  onContinue,
  onSkipAll,
}: {
  onContinue: () => void;
  onSkipAll: () => void;
}) {
  return (
    <div className="space-y-7 text-center sm:text-left">
      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-teal-900 sm:text-5xl">
        Here&apos;s what this does.
      </h1>
      <ul className="space-y-2.5 text-left">
        <BulletRow
          Icon={Wand2}
          title="Pre-fills every Cannes RSVP form for you"
          body="One click on Register me opens the form with your name, email, company and title already filled in."
        />
        <BulletRow
          Icon={ListChecks}
          title="Tracks which ones you got into"
          body="Mark Registered after you submit. Green checkmarks tell you what's confirmed at a glance."
        />
        <BulletRow
          Icon={Users}
          title="Surfaces who&apos;s going"
          body="Endless feed of who&apos;s publicly posting about Cannes 2026 on LinkedIn and X. One click to their profile."
        />
      </ul>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSkipAll}
          className="text-[13px] font-medium text-[color:var(--muted)] hover:text-teal-900"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(214,90,58,0.7)] transition-colors hover:bg-coral-600"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function BulletRow({
  Icon,
  title,
  body,
}: {
  Icon: (p: { className?: string }) => React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-[color:var(--hairline)] bg-white p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-800">
        <Icon className="h-4 w-4" />
      </span>
      <div className="space-y-0.5">
        <div className="font-semibold text-teal-900">{title.replace(/&apos;/g, "’")}</div>
        <div className="text-[13px] text-[color:var(--ink-soft)]">{body.replace(/&apos;/g, "’")}</div>
      </div>
    </li>
  );
}

// ----- Step 2: Save profile -------------------------------------------------

function ProfileStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  const [profile, setProfile, hydrated] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    EMPTY_PROFILE
  );

  // Updater form avoids stale-closure drops on rapid keystrokes.
  const update = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setProfile((prev) => ({
      ...prev,
      [k]: v,
      updatedAt: new Date().toISOString(),
    }));

  const save = () => {
    setProfile((prev) => ({ ...prev, updatedAt: new Date().toISOString() }));
    onContinue();
  };

  const fields = [
    { key: "name" as const, label: "Full name", placeholder: "Jane Doe", type: "text", autoComplete: "name" },
    { key: "email" as const, label: "Work email", placeholder: "jane@yourcompany.com", type: "email", autoComplete: "email" },
    { key: "company" as const, label: "Company", placeholder: "Your Company", type: "text", autoComplete: "organization" },
    { key: "title" as const, label: "Title", placeholder: "CMO / Founder / Head of Brand", type: "text", autoComplete: "organization-title" },
    { key: "linkedinUrl" as const, label: "LinkedIn URL", placeholder: "https://linkedin.com/in/…", type: "url", autoComplete: "url" },
    { key: "phone" as const, label: "Phone (optional)", placeholder: "+1 415 …", type: "tel", autoComplete: "tel" },
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-sand-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
        Required for auto-fill
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold leading-tight text-teal-900 sm:text-[34px]">
          Fill once. Paste into every RSVP form.
        </h2>
        <p className="text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
          Most Cannes event forms ask for the same six fields. Save them here
          and Register me will pre-fill them for you. Everything stays in your
          browser.
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-medium text-teal-800">
        <Lock className="h-3 w-3" /> Stored in this browser only
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-[color:var(--hairline)] bg-white p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {fields.map((f) => (
          <div key={f.key}>
            <label className="field-label">{f.label}</label>
            <input
              type={f.type}
              value={(profile[f.key] as string | undefined) ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              autoComplete={f.autoComplete}
              disabled={!hydrated}
            />
          </div>
        ))}
      </form>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-[13px] font-medium text-[color:var(--muted)] hover:text-teal-900"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(214,90,58,0.7)] transition-colors hover:bg-coral-600"
        >
          Save and finish
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ----- Step 3: Done ---------------------------------------------------------

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-teal-800">
        <Check className="h-6 w-6" />
      </div>
      <h2 className="font-display text-3xl font-semibold leading-tight text-teal-900 sm:text-4xl">
        You&apos;re set.
      </h2>
      <p className="mx-auto max-w-md text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
        Welcome to your Cannes 2026 dashboard. You can re-run this setup any
        time from the Integrations page.
      </p>
      <button
        type="button"
        onClick={onFinish}
        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-sand-50 transition-colors hover:bg-teal-900"
      >
        See my dashboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ----- Skip warning modal ---------------------------------------------------

function SkipWarningModal({
  onSetUpNow,
  onConfirmSkip,
  onCancel,
}: {
  onSetUpNow: () => void;
  onConfirmSkip: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
      />
      <div className="relative z-[71] w-full max-w-md rounded-2xl border border-[color:var(--hairline)] bg-sand-50 p-6 shadow-[0_30px_90px_-20px_rgba(10,46,44,0.7)]">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="space-y-1.5">
            <h3 className="font-display text-xl font-semibold text-teal-900">
              Skip setup?
            </h3>
            <p className="text-[14px] leading-relaxed text-[color:var(--ink-soft)]">
              Without your registration info saved, Register me won&apos;t be
              able to pre-fill RSVP forms. You can still browse the dashboard,
              but you&apos;ll have to type your name and email into every form
              by hand.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onConfirmSkip}
            className="rounded-full border border-[color:var(--hairline)] bg-white px-3.5 py-2 text-[13px] font-medium text-[color:var(--ink-soft)] hover:bg-sand-100"
          >
            Skip anyway
          </button>
          <button
            type="button"
            onClick={onSetUpNow}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-coral-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-coral-600"
          >
            Set up registration info
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
