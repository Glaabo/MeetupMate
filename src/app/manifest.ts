import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreeDay",
    short_name: "FreeDay",
    description: "Find days that work for everyone in your group.",
    start_url: "/groups",
    display: "standalone",
    background_color: "#0a0c14",
    theme_color: "#0a0c14",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
