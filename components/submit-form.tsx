"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormState {
  name: string;
  company: string;
  role: string;
  linkedinUrl: string;
  twitterUrl: string;
  photoUrl: string; // either an http(s) URL OR a data:image/... URL
}

const EMPTY: FormState = {
  name: "",
  company: "",
  role: "",
  linkedinUrl: "",
  twitterUrl: "",
  photoUrl: "",
};

// Maximum file size for a dropped photo BEFORE client-side resize.
// (We accept up to ~12 MB raw; after canvas resize it ships as ~40 KB JPEG.)
const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const TARGET_SIDE = 400;
const JPEG_QUALITY = 0.85;

/** Center-crop the file to a square, resize to TARGET_SIDE, encode as JPEG data URL. */
function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a valid image."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = TARGET_SIDE;
        canvas.height = TARGET_SIDE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Couldn't process that image."));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIDE, TARGET_SIDE);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function SubmitForm() {
  const [state, setState] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setState((prev) => ({ ...prev, [k]: v }));
    if (error) setError(null);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...state, yearSignal: "going-this-year" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        person?: { id: string };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      const id = data.person?.id ?? "";
      router.push(`/people?just-added=${encodeURIComponent(id)}`);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-[color:var(--hairline)] bg-white p-5 sm:grid-cols-2"
      onSubmit={onSubmit}
    >
      <Field label="Full name *" full>
        <input
          type="text"
          required
          value={state.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
          maxLength={60}
        />
      </Field>
      <Field label="Company *">
        <input
          type="text"
          required
          value={state.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Your Company"
          autoComplete="organization"
          maxLength={80}
        />
      </Field>
      <Field label="Role / title">
        <input
          type="text"
          value={state.role}
          onChange={(e) => update("role", e.target.value)}
          placeholder="CMO / Founder / Head of Brand"
          autoComplete="organization-title"
          maxLength={80}
        />
      </Field>
      <Field label="LinkedIn URL">
        <input
          type="url"
          value={state.linkedinUrl}
          onChange={(e) => update("linkedinUrl", e.target.value)}
          placeholder="https://linkedin.com/in/your-slug"
        />
      </Field>
      <Field label="X / Twitter URL">
        <input
          type="url"
          value={state.twitterUrl}
          onChange={(e) => update("twitterUrl", e.target.value)}
          placeholder="https://x.com/your-handle"
        />
      </Field>

      <Field label="Photo" full>
        <PhotoDropzone
          value={state.photoUrl}
          onChange={(v) => update("photoUrl", v)}
          onError={(msg) => setError(msg)}
        />
      </Field>

      {error && (
        <div className="sm:col-span-2 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-[13px] text-coral-700">
          {error}
        </div>
      )}

      <div className="sm:col-span-2 pt-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-teal-900 px-7 py-3 text-[15px] font-semibold text-sand-50 shadow-md shadow-teal-900/15 transition hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Adding you to the list…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Add me to the list
            </>
          )}
        </button>
        <p className="mt-3 text-[12px] text-[color:var(--muted)]">
          By submitting, you agree to be listed on the public attendees page.
          We do not send anything to your email or LinkedIn.
        </p>
      </div>
    </form>
  );
}

function PhotoDropzone({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      onError("That file isn't an image.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      onError("That photo is too large. Try one under 12 MB.");
      return;
    }
    setProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Couldn't process that photo.");
    } finally {
      setProcessing(false);
    }
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
  }

  if (value) {
    return (
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Selected headshot"
          className="h-32 w-32 rounded-2xl border border-[color:var(--hairline)] object-cover"
        />
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1.5 text-[13px] font-medium text-teal-800 hover:bg-sand-100"
          >
            <ImagePlus className="h-3.5 w-3.5" /> Replace
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-coral-200 bg-coral-50 px-3 py-1.5 text-[13px] font-medium text-coral-700 hover:bg-coral-100"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onPick}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={[
        "flex h-36 w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition",
        dragging
          ? "border-teal-700 bg-teal-50"
          : "border-[color:var(--hairline)] bg-sand-50/60 hover:border-teal-700 hover:bg-sand-100",
      ].join(" ")}
    >
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-[color:var(--hairline)]">
          <ImagePlus className="h-6 w-6 text-[color:var(--muted)]" strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-[13px] font-medium text-[color:var(--ink-soft)]">
        {processing ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Resizing…
          </span>
        ) : (
          <>Drag a photo here, or click to upload</>
        )}
      </div>
      <div className="text-[11px] text-[color:var(--muted)]">
        We&apos;ll crop it to a square automatically. PNG / JPG / WebP.
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
    </label>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
