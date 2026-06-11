import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeetupMate",
    short_name: "MeetupMate",
    description: "Find days that work for everyone in your group.",
    start_url: "/groups",
    display: "standalone",
    background_color: "#faf5ee",
    theme_color: "#1d503a",
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
