import { SpeechProvider, SpeechProviderEvents } from './types';

export class BrowserSpeechRecognitionProvider implements SpeechProvider {
  private recognition: SpeechRecognition | null = null;
  private handlers: SpeechProviderEvents | null = null;
  private finalTranscript = '';
  private isRunning = false;
  private errorOccurred = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private firstResultTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly silenceDelay = 2000;
  private readonly firstResultDelay = 20000;

  isSupported(): boolean {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    console.log('[STT] isSupported:', supported);
    if (!supported) {
      console.warn('[STT] No SpeechRecognition or webkitSpeechRecognition found on window.');
    }
    return supported;
  }

  setEventHandlers(handlers: SpeechProviderEvents): void {
    this.handlers = handlers;
  }

  start(): void {
    if (!this.isSupported()) {
      console.warn('[STT] start() called but not supported');
      return;
    }
    if (this.isRunning) {
      console.log('[STT] start() called but already running');
      return;
    }

    console.log('[STT] start()');
    this.finalTranscript = '';
    this.isRunning = true;
    this.errorOccurred = false;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error('[STT] SpeechRecognitionAPI is null despite isSupported');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    console.log('[STT] Created recognition instance:', this.recognition);

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = navigator.language;
    console.log('[STT] Settings: continuous=true, interimResults=true, lang=' + navigator.language);

    this.recognition.onstart = () => {
      console.log('[STT] EVENT: onstart — recognition has begun');
    };

    this.recognition.onspeechstart = () => {
      console.log('[STT] EVENT: onspeechstart — speech detected');
    };

    this.recognition.onspeechend = () => {
      console.log('[STT] EVENT: onspeechend — speech ended');
    };

    this.recognition.onaudiostart = () => {
      console.log('[STT] EVENT: onaudiostart — audio capture started');
    };

    this.recognition.onaudioend = () => {
      console.log('[STT] EVENT: onaudioend — audio capture ended');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[STT] EVENT: onresult fired');
      console.log('[STT] event.resultIndex:', event.resultIndex);
      console.log('[STT] event.results.length:', event.results.length);
      console.log('[STT] event.results:', event.results);

      this.clearFirstResultTimeout();

      let newFinal = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        console.log(`[STT]   results[${i}]: isFinal=${result.isFinal}, transcript="${transcript}"`);
        if (result.isFinal) {
          newFinal += transcript;
        } else {
          interim += transcript;
        }
      }

      if (newFinal) {
        this.finalTranscript += newFinal;
      }

      console.log('[STT] finalTranscript:', JSON.stringify(this.finalTranscript));
      console.log('[STT] interim:', JSON.stringify(interim));

      this.handlers?.onResult(this.finalTranscript, interim);

      this.resetSilenceTimer();
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('[STT] EVENT: onerror — error:', event.error, 'message:', event.message);
      this.clearSilenceTimer();
      this.clearFirstResultTimeout();
      this.isRunning = false;
      this.errorOccurred = true;
      if (event.error === 'no-speech') {
        console.log('[STT]   -> no-speech, sending final transcript and transitioning');
        this.errorOccurred = false;
        this.handlers?.onResult(this.finalTranscript, '');
        this.handlers?.onStateChange('processing');
        setTimeout(() => {
          this.handlers?.onStateChange('completed');
        }, 500);
        return;
      }
      if (event.error === 'not-allowed') {
        console.log('[STT]   -> permission denied');
        this.handlers?.onError({
          code: 'permission-denied',
          message: 'Microphone permission denied. Enable microphone access to use voice input.',
        });
        return;
      }
      const message =
        event.error === 'audio-capture'
          ? 'Could not access microphone. Check that a mic is connected and no other app is using it, then refresh and try again.'
          : `Voice input error: ${event.error}`;
      this.handlers?.onError({
        code: event.error,
        message,
      });
    };

    this.recognition.onend = () => {
      console.log('[STT] EVENT: onend — recognition ended (errorOccurred=' + this.errorOccurred + ')');
      this.isRunning = false;
      this.clearSilenceTimer();
      this.clearFirstResultTimeout();
      this.handlers?.onResult(this.finalTranscript, '');
      if (!this.errorOccurred) {
        this.handlers?.onStateChange('processing');
        setTimeout(() => {
          this.handlers?.onStateChange('completed');
        }, 500);
      }
    };

    this.handlers?.onStateChange('listening');

    try {
      console.log('[STT] Calling recognition.start()...');
      this.recognition.start();
      console.log('[STT] recognition.start() succeeded');

      this.firstResultTimeout = setTimeout(() => {
        console.warn('[STT] No onresult received within ' + (this.firstResultDelay / 1000) + 's. Stopping recognition.');
        if (this.isRunning) {
          this.recognition?.stop();
        }
      }, this.firstResultDelay);
    } catch (err) {
      console.error('[STT] recognition.start() threw:', err);
      this.isRunning = false;
      this.handlers?.onError({
        code: 'start-failed',
        message: 'Failed to start speech recognition.',
      });
    }
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('[STT] stop() called but not running');
      return;
    }
    console.log('[STT] stop()');
    this.clearSilenceTimer();
    this.clearFirstResultTimeout();
    this.recognition?.stop();
  }

  cancel(): void {
    console.log('[STT] cancel()');
    this.isRunning = false;
    this.errorOccurred = false;
    this.clearSilenceTimer();
    this.clearFirstResultTimeout();
    this.recognition?.abort();
    this.finalTranscript = '';
    this.handlers?.onStateChange('idle');
  }

  destroy(): void {
    console.log('[STT] destroy()');
    this.cancel();
    this.clearSilenceTimer();
    this.clearFirstResultTimeout();
    this.recognition = null;
    this.handlers = null;
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      console.log('[STT] Silence timer fired — no new result for ' + (this.silenceDelay / 1000) + 's, stopping');
      if (this.isRunning) {
        this.recognition?.stop();
      }
    }, this.silenceDelay);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer !== null) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private clearFirstResultTimeout(): void {
    if (this.firstResultTimeout !== null) {
      clearTimeout(this.firstResultTimeout);
      this.firstResultTimeout = null;
    }
  }
}
