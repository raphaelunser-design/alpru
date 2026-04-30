"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Toast({ message }: { message: string }) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion { duration: 0 } : { duration: 0.18, ease: "easeOut" as const };

  return (
    <motion.div
      initial={reduceMotion { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
      transition={transition}
      className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-lg backdrop-blur"
    >
      {message}
    </motion.div>
  );
}
