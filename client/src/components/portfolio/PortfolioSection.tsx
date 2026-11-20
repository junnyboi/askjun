/**
 * PortfolioSection — a titled, collapsible section of the Portfolio page.
 * Open state is owned by the page so the contents list can open a section it jumps to.
 */
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioSectionProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Called once the section has finished opening */
  onOpened: (id: string) => void;
  children: ReactNode;
}

const OPEN = { height: "auto", opacity: 1 };
const CLOSED = { height: 0, opacity: 0 };

export function PortfolioSection({ id, title, isOpen, onToggle, onOpened, children }: PortfolioSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border py-6">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="scaled-title flex items-center gap-3 text-foreground">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-hidden />
          {title}
        </h2>
        <ChevronDown
          size={18}
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
            !isOpen && "-rotate-90"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={CLOSED}
            animate={OPEN}
            exit={CLOSED}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={(definition) => {
              if (definition === OPEN) onOpened(id);
            }}
            className="overflow-hidden"
          >
            <div className="pt-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
