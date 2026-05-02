"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import {
  hasErrors,
  validateForm,
  type FormData,
  type FormErrors,
} from "@/lib/validation";
import { encodePortalData, pingEvent } from "@/lib/utils";

const DRAFT_KEY = "bdp_draft";
const SESSION_KEY = "bdp_session";

export function useCheckoutSubmit(form: FormData) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const checkoutUnavailable = !config.CHECKOUT_URL || config.CHECKOUT_URL === "#";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      const firstKey = Object.keys(nextErrors)[0];
      if (firstKey) {
        const element = document.getElementById(`field-${firstKey}`);
        element?.focus();
      }
      return;
    }

    setSubmitting(true);
    setStorageError(false);
    setCheckoutError(null);

    const serialised = JSON.stringify(form);
    let saved = false;

    try {
      localStorage.setItem(SESSION_KEY, serialised);
      saved = true;
    } catch {
      try {
        sessionStorage.setItem(SESSION_KEY, serialised);
        saved = true;
      } catch {
        // both storage APIs unavailable
      }
    }

    if (!saved) {
      setSubmitting(false);
      setStorageError(true);
      return;
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Silent.
    }

    setSubmitting(false);
    setRecoveryCode(encodePortalData(form));
  }

  function continueToCheckout(checkoutUrl?: string) {
    const url = checkoutUrl ?? config.CHECKOUT_URL;
    if (!url || url === "#") {
      setSubmitting(false);
      setCheckoutError("Checkout not configured.");
      return;
    }

    setSubmitting(true);
    const encoded = encodePortalData(form);
    const separator = url.includes("?") ? "&" : "?";
    const checkoutWithReturn = `${url}${separator}checkout[custom][portal_data]=${encodeURIComponent(encoded)}`;
    pingEvent("portal_form_submit");
    window.location.href = checkoutWithReturn;
  }

  function dismissRecoveryCode() {
    setRecoveryCode(null);
  }

  return {
    errors,
    setErrors,
    submitting,
    storageError,
    checkoutError,
    checkoutUnavailable,
    handleSubmit,
    recoveryCode,
    continueToCheckout,
    dismissRecoveryCode,
  };
}