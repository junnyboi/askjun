export default function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          askJun · Built with React + TypeScript + Tailwind
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          Singapore · 2026
        </span>
      </div>
    </footer>
  );
}
