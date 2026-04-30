"use client";

import { useEffect, useRef, useState } from "react";
import { EMPTY_FORM_DATA, formSchema, type FormData } from "@/lib/validation";

const DRAFT_KEY = "bdp_draft";
const SESSION_KEY = "bdp_session";

export function useDraft() {
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM_DATA });
  const [draftRestored, setDraftRestored] = useState(false);
  const draftHydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        draftHydrated.current = true;
        return;
      }

      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        draftHydrated.current = true;
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      const result = formSchema.safeParse(parsed);
      if (result.success) {
        setForm(result.data);
        setDraftRestored(true);
      }
    } catch {
      // Silent — draft restore is a nice-to-have, not a blocker.
    } finally {
      draftHydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!draftHydrated.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      } catch {
        // Silent — draft save is a nice-to-have, not a blocker.
      }
    }, 250);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form]);

  function startOver() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Silent.
    }

    setForm({ ...EMPTY_FORM_DATA });
    setDraftRestored(false);
  }

  return {
    form,
    setForm,
    draftRestored,
    startOver,
  };
}