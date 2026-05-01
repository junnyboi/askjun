import ThemeToggle from "@/components/ThemeToggle";

interface HeaderProps {
  onOpenChat: () => void;
}

export default function Header({ onOpenChat }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 border-b border-border">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <a href="/" className="font-mono text-sm tracking-tight text-foreground">
          ask<span className="text-accent">Jun</span>
        </a>

        <nav className="hidden sm:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#experience" className="hover:text-foreground transition-colors">Experience</a>
          <a href="#skills" className="hover:text-foreground transition-colors">Skills</a>
          <a href="#projects" className="hover:text-foreground transition-colors">Projects</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={onOpenChat}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-mono bg-foreground text-background hover:opacity-80 transition-opacity active:scale-95"
          >
            Chat
          </button>
        </div>
      </div>
    </header>
  );
}
