/**
 * Safe CV download — validates the PDF is accessible before triggering download.
 * If the file is missing or corrupted, shows a toast directing users to contact Jun.
 */

import { toast } from "sonner";
import { analytics } from "./analytics";

const CV_URL = "/assets/JunBoh-CV-2026.pdf";
const CV_FILENAME = "JunBoh_CV_2026.pdf";

export async function downloadCV(e?: React.MouseEvent) {
  // Prevent the default <a> download behavior — we'll handle it manually
  if (e) e.preventDefault();

  analytics.cvDownload();

  try {
    const response = await fetch(CV_URL, { method: "HEAD" });

    if (!response.ok || !response.headers.get("content-type")?.includes("pdf")) {
      showFailureToast();
      return;
    }

    // File is valid — trigger the download
    const link = document.createElement("a");
    link.href = CV_URL;
    link.download = CV_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    showFailureToast();
  }
}

function showFailureToast() {
  toast.error("CV temporarily unavailable", {
    description: "Please reach Jun directly for a copy — boh.ze.jun@gmail.com or LinkedIn.",
    duration: 8000,
    action: {
      label: "Email Jun",
      onClick: () => window.open("mailto:boh.ze.jun@gmail.com?subject=Request for CV", "_blank"),
    },
  });
}
