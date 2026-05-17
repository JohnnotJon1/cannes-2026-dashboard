"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Lock } from "lucide-react";
import { useState } from "react";
import {
  EVENT_CATEGORIES,
  type CustomEvent,
  type EventCategory,
} from "@/types";

type Props = {
  onAdd: (event: CustomEvent) => void;
};

export function AddEventDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [category, setCategory] = useState<EventCategory>("dinner");
  const [startDate, setStartDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [nextAction, setNextAction] = useState("");

  const reset = () => {
    setName("");
    setOrganizer("");
    setCategory("dinner");
    setStartDate("");
    setLocation("");
    setDescription("");
    setRegistrationUrl("");
    setNextAction("");
  };

  const canSubmit = name.trim().length > 0 && startDate.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const id = `custom-${Date.now()}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 32)}`;
    const event: CustomEvent = {
      id,
      name: name.trim(),
      organizer: organizer.trim() || "You",
      category,
      startDate: new Date(startDate).toISOString(),
      location: location.trim() || "TBD",
      description: description.trim() || "Custom event added by you.",
      registrationUrl: registrationUrl.trim() || undefined,
      registrationType: "unknown",
      nextAction: nextAction.trim() || undefined,
      source: "Added by you",
      confidence: "verified",
      isCustom: true,
      createdAt: new Date().toISOString(),
      defaultStatus: "pending",
    };
    onAdd(event);
    reset();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-teal-800 bg-teal-800 px-3.5 py-1.5 text-sm font-semibold text-sand-50 transition-colors hover:bg-teal-900"
        >
          <Plus className="h-4 w-4" />
          Add event
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--hairline)] p-5">
            <div>
              <Dialog.Title asChild>
                <h2 className="font-display text-xl font-semibold text-teal-900">
                  Add your own event
                </h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="mt-1 text-[13px] text-[color:var(--muted)]">
                  Track invite-only dinners, custom meetings, or anything not in the seed list.
                </p>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-[color:var(--ink-soft)] hover:bg-sand-100"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 p-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-medium text-teal-800">
              <Lock className="h-3 w-3" /> Stored in this browser only
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event name *">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Founder dinner with portfolio"
                />
              </Field>
              <Field label="Organizer / host">
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Who's hosting?"
                />
              </Field>
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date & time *">
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field label="Location" className="sm:col-span-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hôtel Martinez, La Croisette…"
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why are you going? Who else will be there?"
                />
              </Field>
              <Field label="Registration URL">
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Next action">
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Confirm dress code, send dinner invites…"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--hairline)] bg-white px-3.5 py-1.5 text-sm font-medium text-[color:var(--ink-soft)] hover:bg-sand-100"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="rounded-full bg-coral-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save event
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
