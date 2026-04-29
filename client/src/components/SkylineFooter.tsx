/*
 * SkylineFooter — Glass Atelier Design
 * Singapore skyline illustration as a footer element.
 */

const SKYLINE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663370222890/cA3toqknd22cLAL6g9pNa6/singapore-skyline-HPdos9Exa2v9FH5u7nPnok.webp";

export default function SkylineFooter() {
  return (
    <footer className="relative z-10 mt-8">
      <div className="relative">
        <img
          src={SKYLINE_URL}
          alt="Singapore skyline"
          className="w-full h-24 sm:h-32 lg:h-40 object-cover object-top opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground/40 font-mono">
            Built with React + TypeScript + Tailwind · Singapore 2026
          </p>
        </div>
      </div>
    </footer>
  );
}
