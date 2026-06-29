'use client';

import { motion } from 'framer-motion';
import { SpeechState } from '@/lib/speech/types';
import VoiceWaveform from './VoiceWaveform';

interface MicrophoneButtonProps {
  state: SpeechState;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function MicrophoneButton({
  state,
  isSupported,
  onStart,
  onStop,
  onCancel,
}: MicrophoneButtonProps) {
  if (!isSupported) return null;

  switch (state) {
    case 'idle':
      return (
        <motion.button
          type="button"
          onClick={onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          aria-label="Start voice input"
        >
          <MicIcon />
        </motion.button>
      );

    case 'listening':
      return (
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onStop}
            animate={{
              boxShadow: [
                '0 0 0px rgba(59,130,246,0)',
                '0 0 14px rgba(59,130,246,0.35)',
                '0 0 0px rgba(59,130,246,0)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label="Stop recording"
          >
            <MicIcon className="text-blue-400" />
          </motion.button>
          <VoiceWaveform />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-blue-400/70 font-medium select-none"
          >
            Listening...
          </motion.span>
        </div>
      );

    case 'processing':
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center">
            <MicIcon className="text-zinc-600" />
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-zinc-500 font-medium select-none"
          >
            Processing...
          </motion.span>
        </div>
      );

    case 'completed':
      return (
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={onCancel}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
            aria-label="Clear voice input"
          >
            <CheckIcon />
          </motion.button>
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-green-400/70 font-medium select-none"
          >
            Voice captured
          </motion.span>
        </div>
      );

    case 'error':
      return (
        <motion.button
          type="button"
          onClick={onStart}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 0.4 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          aria-label="Retry voice input"
        >
          <MicIcon />
        </motion.button>
      );
  }
}
