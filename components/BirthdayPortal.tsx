// Re-export shim: the canonical implementation now lives at
// `features/portal/BirthdayPortal.tsx`. This shim is kept so that
// `app/pack/PackClient.tsx` (which is out of scope for this refactor)
// continues to resolve `@/components/BirthdayPortal` without modification.
export { default } from "@/features/portal/BirthdayPortal";
export type { BirthdayPortalProps } from "@/features/portal/types";
