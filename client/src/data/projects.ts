/*
 * Projects shown on the Portfolio page: featured work, game dev and side projects.
 */

export interface FeaturedProject {
  title: string;
  description: string;
  tags: string[];
  tech: string[];
  image: string;
  link: string;
  github: string;
  visibility: "public" | "private";
  liveDemo?: boolean;
}

export interface LinkedProject {
  title: string;
  description: string;
  tags: string[];
  link: string;
  visibility: "public" | "private";
  liveDemo?: boolean;
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    title: "askJun AI Portfolio",
    description: "This site — chat-first AI portfolio",
    tags: ["AI", "Web"],
    tech: ["React", "TypeScript", "RAG"],
    image: "/thumbnails/askjun.webp",
    link: "https://askjun.org",
    github: "https://github.com/junnyboi/askjun",
    visibility: "public",
    liveDemo: true,
  },
  {
    title: "Swipe",
    description: "Image aggregation pinboard — save, organize, and discover visual inspiration",
    tags: ["Web", "Creative"],
    tech: ["TypeScript", "React", "Node.js"],
    image: "/thumbnails/swipe.webp",
    link: "https://swipe.manus.space",
    github: "https://github.com/junnyboi/swipe",
    visibility: "public",
    liveDemo: true,
  },
  {
    title: "Trident",
    description: "Swiss Army Knife for macOS productivity — menu bar app with floating panels",
    tags: ["Productivity", "Swift"],
    tech: ["Swift", "macOS", "AppKit"],
    image: "/thumbnails/trident.webp",
    link: "https://github.com/junnyboi/trident",
    github: "https://github.com/junnyboi/trident",
    visibility: "private",
  },
  {
    title: "Trident Mobile",
    description: "Android companion app for Trident with cloud sync via Supabase",
    tags: ["Mobile", "Kotlin"],
    tech: ["Kotlin", "Android", "Supabase"],
    image: "/thumbnails/trident-mobile.webp",
    link: "https://github.com/junnyboi/trident-mobile",
    github: "https://github.com/junnyboi/trident-mobile",
    visibility: "private",
  },
  {
    title: "Mijun",
    description: "Cinematic tea & preserved flower e-commerce platform",
    tags: ["E-commerce", "Creative"],
    tech: ["TypeScript", "React"],
    image: "/thumbnails/mijun.webp",
    link: "https://mijun.co",
    github: "https://github.com/junnyboi/mijun",
    visibility: "private",
    liveDemo: true,
  },
  {
    title: "Housewarmer",
    description: "Scroll-animated housewarming invitation with parallax effects and RSVP",
    tags: ["Creative", "Web"],
    tech: ["TypeScript", "React", "GSAP"],
    image: "/thumbnails/housewarmer.webp",
    link: "https://mijun-housewarming.manus.space/",
    github: "https://github.com/junnyboi/housewarmer",
    visibility: "private",
    liveDemo: true,
  },
];

export const GAME_PROJECTS: LinkedProject[] = [
  { title: "TeaPets (2D)", description: "2D pixel-art bullet hell roguelike", tags: ["PixiJS", "TypeScript"], link: "https://teapets.mircovm.com/", visibility: "public", liveDemo: true },
  { title: "TeaPets 3D", description: "Browser-based 3D roguelike with a cute slime", tags: ["Three.js", "TypeScript"], link: "https://teapets-3d.mircovm.com/", visibility: "public", liveDemo: true },
  { title: "Deep in Abyss", description: "Dive deep into the abyss in this browser adventure", tags: ["Web", "Adventure"], link: "https://deep-in-abyss.manus.space/", visibility: "public", liveDemo: true },
  { title: "Deepforge", description: "Forge your destiny in this browser-based RPG", tags: ["Web", "RPG"], link: "https://deepforge.manus.space/", visibility: "public", liveDemo: true },
  { title: "Throne of Beasts", description: "Fantasy strategy game with beast companions", tags: ["Web", "Strategy"], link: "https://throne-of-beasts.manus.space/", visibility: "public", liveDemo: true },
  { title: "Aegis TD", description: "Tower defense game with elemental mechanics", tags: ["Web", "Tower Defense"], link: "https://aegis-td.manus.space/", visibility: "public", liveDemo: true },
  { title: "Pitmaster", description: "BBQ management idle tycoon game", tags: ["Web", "Idle"], link: "https://pitmaster.manus.space/", visibility: "public", liveDemo: true },
  { title: "Gobbo", description: "Unity 2D game — a couple's passion project", tags: ["Unity", "C#"], link: "https://github.com/junnyboi/Gobbo-2D", visibility: "public" },
];

export const SIDE_PROJECTS: LinkedProject[] = [
  { title: "IsleProject", description: "NFT island community project", tags: ["Web3", "Creative"], link: "https://github.com/junnyboi/IsleProjectNFT", visibility: "private" },
  { title: "Booking Bot", description: "Automated booking system", tags: ["Automation"], link: "https://github.com/junnyboi/booking-bot", visibility: "private" },
  { title: "Polygen", description: "Procedurally generated low poly asset collection", tags: ["Creative", "3D"], link: "https://github.com/junnyboi/polygen", visibility: "private" },
  { title: "Finance Tracker", description: "Ionic + React mobile finance app", tags: ["Mobile"], link: "https://github.com/junnyboi/tony-stocks", visibility: "public" },
];
