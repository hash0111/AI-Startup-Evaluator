'use client';

import { motion } from 'framer-motion';

const BAR_COUNT = 5;

const WAVE_PATTERNS: number[][] = [
  [4, 14, 4, 10, 4, 16, 4],
  [4, 18, 4, 8, 4, 12, 4],
  [4, 10, 4, 16, 4, 14, 4],
  [4, 16, 4, 12, 4, 8, 4],
  [4, 12, 4, 14, 4, 18, 4],
];

export default function VoiceWaveform() {
  return (
    <div className="flex items-center gap-[3px] h-5" aria-hidden="true">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] bg-blue-500 rounded-full"
          animate={{ height: WAVE_PATTERNS[i] }}
          transition={{
            repeat: Infinity,
            duration: 1.0,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
