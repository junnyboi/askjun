/*
 * Not-found page, in the site's own style. Follows the light/dark theme.
 */
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found — askJun");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <p className="font-mono text-6xl font-bold text-foreground">404</p>
      <h1 className="mt-4 text-2xl text-foreground">Page Not Found</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        Sorry, the page you are looking for doesn't exist. It may have been moved or deleted.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-5 font-mono text-sm text-background transition-opacity hover:opacity-85 active:scale-[0.98]"
      >
        Go Home
      </Link>
    </main>
  );
}
