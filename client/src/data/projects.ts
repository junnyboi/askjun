/*
 * Projects shown on the Portfolio page: featured work, game dev and side projects.
 *
 * Only links that work for a visitor are listed. `demoUrl` is a live site;
 * `repoUrl` is a public repository. A project with neither is shown without a link.
 * Checked 20 Nov 2026. Links left out because they returned 404 to visitors:
 *   demos:  swipe.manus.space, teapets.mircovm.com, teapets-3d.mircovm.com, aegis-td.manus.space
 *   private repositories: swipe, trident, trident-mobile, mijun, housewarmer,
 *                         IsleProjectNFT, booking-bot, polygen (all github.com/junnyboi/…)
 * To bring one back, add its demoUrl or repoUrl here once it is reachable.
 */

interface ProjectLinks {
  /** Live site, when one is up */
  demoUrl?: string;
  /** Public repository; omitted for private ones */
  repoUrl?: string;
  /** True when the code is in a private repository */
  isPrivate?: boolean;
}

export interface FeaturedProject extends ProjectLinks {
  title: string;
  description: string;
  tags: string[];
  tech: string[];
  image: string;
}

export interface LinkedProject extends ProjectLinks {
  title: string;
  description: string;
  tags: string[];
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    title: "askJun AI Portfolio",
    description: "This site — chat-first AI portfolio",
    tags: ["AI", "Web"],
    tech: ["React", "TypeScript", "RAG"],
    image: "/thumbnails/askjun.webp",
    demoUrl: "https://askjun.org",
    repoUrl: "https://github.com/junnyboi/askjun",
  },
  {
    title: "Swipe",
    description: "Image aggregation pinboard — save, organize, and discover visual inspiration",
    tags: ["Web", "Creative"],
    tech: ["TypeScript", "React", "Node.js"],
    image: "/thumbnails/swipe.webp",
    isPrivate: true,
  },
  {
    title: "Trident",
    description: "Swiss Army Knife for macOS productivity — menu bar app with floating panels",
    tags: ["Productivity", "Swift"],
    tech: ["Swift", "macOS", "AppKit"],
    image: "/thumbnails/trident.webp",
    isPrivate: true,
  },
  {
    title: "Trident Mobile",
    description: "Android companion app for Trident with cloud sync via Supabase",
    tags: ["Mobile", "Kotlin"],
    tech: ["Kotlin", "Android", "Supabase"],
    image: "/thumbnails/trident-mobile.webp",
    isPrivate: true,
  },
  {
    title: "Mijun",
    description: "Cinematic tea & preserved flower e-commerce platform",
    tags: ["E-commerce", "Creative"],
    tech: ["TypeScript", "React"],
    image: "/thumbnails/mijun.webp",
    demoUrl: "https://mijun.co",
    isPrivate: true,
  },
  {
    title: "Housewarmer",
    description: "Scroll-animated housewarming invitation with parallax effects and RSVP",
    tags: ["Creative", "Web"],
    tech: ["TypeScript", "React", "GSAP"],
    image: "/thumbnails/housewarmer.webp",
    demoUrl: "https://mijun-housewarming.manus.space/",
    isPrivate: true,
  },
];

export const GAME_PROJECTS: LinkedProject[] = [
  { title: "TeaPets (2D)", description: "2D pixel-art bullet hell roguelike", tags: ["PixiJS", "TypeScript"] },
  { title: "TeaPets 3D", description: "Browser-based 3D roguelike with a cute slime", tags: ["Three.js", "TypeScript"] },
  { title: "Deep in Abyss", description: "Dive deep into the abyss in this browser adventure", tags: ["Web", "Adventure"], demoUrl: "https://deep-in-abyss.manus.space/" },
  { title: "Deepforge", description: "Forge your destiny in this browser-based RPG", tags: ["Web", "RPG"], demoUrl: "https://deepforge.manus.space/" },
  { title: "Throne of Beasts", description: "Fantasy strategy game with beast companions", tags: ["Web", "Strategy"], demoUrl: "https://throne-of-beasts.manus.space/" },
  { title: "Aegis TD", description: "Tower defense game with elemental mechanics", tags: ["Web", "Tower Defense"] },
  { title: "Pitmaster", description: "BBQ management idle tycoon game", tags: ["Web", "Idle"], demoUrl: "https://pitmaster.manus.space/" },
  { title: "Gobbo", description: "Unity 2D game — a couple's passion project", tags: ["Unity", "C#"], repoUrl: "https://github.com/junnyboi/Gobbo-2D" },
];

export const SIDE_PROJECTS: LinkedProject[] = [
  { title: "IsleProject", description: "NFT island community project", tags: ["Web3", "Creative"], isPrivate: true },
  { title: "Booking Bot", description: "Automated booking system", tags: ["Automation"], isPrivate: true },
  { title: "Polygen", description: "Procedurally generated low poly asset collection", tags: ["Creative", "3D"], isPrivate: true },
  { title: "Finance Tracker", description: "Ionic + React mobile finance app", tags: ["Mobile"], repoUrl: "https://github.com/junnyboi/tony-stocks" },
];
