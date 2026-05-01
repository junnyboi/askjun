import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Hide after fonts load or max 1.5s
    const timeout = setTimeout(() => setVisible(false), 1500);
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setTimeout(() => setVisible(false), 300);
      });
    }
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
        >
          <div className="flex items-center gap-1">
            <span className="font-mono text-lg text-foreground">
              ask<span className="text-accent">Jun</span>
            </span>
            <span className="w-0.5 h-5 bg-accent animate-blink" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
