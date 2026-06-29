export type SpeechState = 'idle' | 'listening' | 'processing' | 'completed' | 'error';

export interface SpeechError {
  code: string;
  message: string;
}

export interface SpeechProviderEvents {
  onResult: (finalText: string, interimText: string) => void;
  onStateChange: (state: SpeechState) => void;
  onError: (error: SpeechError) => void;
}

export interface SpeechProvider {
  start(): void;
  stop(): void;
  cancel(): void;
  isSupported(): boolean;
  setEventHandlers(handlers: SpeechProviderEvents): void;
  destroy(): void;
}
