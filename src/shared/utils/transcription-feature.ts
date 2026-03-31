/**
 * Transcription / Whisper feature flag.
 *
 * Defaults to enabled unless explicitly disabled via env:
 * - VITE_ENABLE_TRANSCRIPTION=false
 */
export const isTranscriptionEnabled: boolean =
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env !== 'undefined' &&
  import.meta.env.VITE_ENABLE_TRANSCRIPTION !== 'false';

