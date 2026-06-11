import type { SVGProps } from "react";

/**
 * Consistent line-icon set: 24x24 viewBox, 1.8 stroke, round caps/joins,
 * drawn in currentColor so they inherit the theme.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Brand                                                                */
/* ------------------------------------------------------------------ */

export function LogoMark(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.2" y="5" width="17.6" height="16" rx="2.6" />
      <path d="M3.2 9.6h17.6" />
      <path d="M8 2.8v4M16 2.8v4" />
      <path d="M9 15.4l2.1 2.1 3.9-4.2" />
    </Base>
  );
}

/* ------------------------------------------------------------------ */
/* Group pictograms                                                     */
/* ------------------------------------------------------------------ */

export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.2" y="5" width="17.6" height="16" rx="2.6" />
      <path d="M3.2 9.6h17.6" />
      <path d="M8 2.8v4M16 2.8v4" />
    </Base>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7.5 4h9v5.2a4.5 4.5 0 0 1-9 0V4z" />
      <path d="M7.5 5.8H4.8c.1 2.6 1.4 4 3.2 4.4M16.5 5.8h2.7c-.1 2.6-1.4 4-3.2 4.4" />
      <path d="M12 13.8v3.2" />
      <path d="M8.6 20.2h6.8" />
      <path d="M10 20.2l2-3.2 2 3.2" />
    </Base>
  );
}

export function IconMug(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5.5 5h10v13a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V5z" />
      <path d="M15.5 9h2.4a2 2 0 0 1 2 2v2.4a2 2 0 0 1-2 2h-2.4" />
      <path d="M5.5 8.6h10" />
    </Base>
  );
}

export function IconDice(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="8.8" cy="8.8" r="0.4" fill="currentColor" strokeWidth="1.4" />
      <circle cx="15.2" cy="8.8" r="0.4" fill="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="0.4" fill="currentColor" strokeWidth="1.4" />
      <circle cx="8.8" cy="15.2" r="0.4" fill="currentColor" strokeWidth="1.4" />
      <circle cx="15.2" cy="15.2" r="0.4" fill="currentColor" strokeWidth="1.4" />
    </Base>
  );
}

export function IconFilm(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
      <path d="M8.3 5v14M15.7 5v14" />
      <path d="M3.5 9.5h4.8M3.5 14.5h4.8M15.7 9.5h4.8M15.7 14.5h4.8" />
    </Base>
  );
}

export function IconMountains(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 18.5h18" />
      <path d="M3.5 18.5L9.5 8l4.1 7" />
      <path d="M13 14.6l2.9-4.8 4.6 8.7" />
      <circle cx="17.4" cy="5.8" r="1.5" />
    </Base>
  );
}

export function IconUtensils(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7.5 4v16" />
      <path d="M5 4v4a2.5 2.5 0 0 0 5 0V4" />
      <path d="M17 4c-1.9 1.9-2.7 4.3-2.7 6.6 0 1.5 1.1 2.6 2.7 2.6V20" />
    </Base>
  );
}

export function IconGamepad(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.6 7.8h10.8a4.4 4.4 0 0 1 4.3 5.3l-.8 3.6a2.4 2.4 0 0 1-4.1 1.1L14.9 16H9.1l-1.9 1.8a2.4 2.4 0 0 1-4.1-1.1l-.8-3.6a4.4 4.4 0 0 1 4.3-5.3z" />
      <path d="M9 10.6v3.2M7.4 12.2h3.2" />
      <circle cx="15.3" cy="11.4" r="0.4" fill="currentColor" strokeWidth="1.4" />
      <circle cx="17.3" cy="13.2" r="0.4" fill="currentColor" strokeWidth="1.4" />
    </Base>
  );
}

export function IconTent(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4.5L3.5 19h17L12 4.5z" />
      <path d="M9.4 19L12 14l2.6 5" />
    </Base>
  );
}

export function IconUmbrella(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4.2a8.2 8.2 0 0 1 8.2 8.2H3.8A8.2 8.2 0 0 1 12 4.2z" />
      <path d="M12 4.2V2.6" />
      <path d="M12 12.4V18a2 2 0 0 0 4 0" />
    </Base>
  );
}

/* ------------------------------------------------------------------ */
/* UI pictograms                                                        */
/* ------------------------------------------------------------------ */

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8.4" r="3.2" />
      <path d="M3.4 19.2c.4-3.3 2.7-5.1 5.6-5.1s5.2 1.8 5.6 5.1" />
      <path d="M15.4 5.6a3.2 3.2 0 0 1 0 5.7" />
      <path d="M17.3 14.4c2 .7 3.2 2.4 3.4 4.8" />
    </Base>
  );
}

export function IconShield(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l7 2.7v5.5c0 4.5-3 7.7-7 9.8-4-2.1-7-5.3-7-9.8V5.7L12 3z" />
      <path d="M9 11.7l2.1 2.1 3.9-4.2" />
    </Base>
  );
}

export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" strokeWidth="1.4" />
    </Base>
  );
}

export function IconKey(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M10.9 12.6L19.5 4" />
      <path d="M15.5 8l2.6 2.6M19.5 4l1 1" />
    </Base>
  );
}

export function IconLock(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9.5" rx="2.2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15.6" r="0.4" fill="currentColor" strokeWidth="1.4" />
    </Base>
  );
}

export function IconCompass(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.9 9.1l-1.9 4.7-4 2.1 1.9-4.7 4-2.1z" />
    </Base>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10 13.2a4.6 4.6 0 0 0 7 .5l2.6-2.6a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5" />
      <path d="M14 10.8a4.6 4.6 0 0 0-7-.5l-2.6 2.6a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5" />
    </Base>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4v10.5M12 14.5l-4-4M12 14.5l4-4" />
      <path d="M4.5 19.5h15" />
    </Base>
  );
}

export function IconSync(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 5.2v4.6h-4.6" />
      <path d="M4 18.8v-4.6h4.6" />
      <path d="M19.6 9.8A8 8 0 0 0 6.2 6.4L4 8.6M4.4 14.2a8 8 0 0 0 13.4 3.4l2.2-2.2" />
    </Base>
  );
}

export function IconPerson(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.4c.5-4 3.4-6 7.5-6s7 2 7.5 6" />
    </Base>
  );
}

export function IconGear(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Base>
  );
}

/* ------------------------------------------------------------------ */
/* Group icon registry                                                  */
/* ------------------------------------------------------------------ */

export const GROUP_ICONS = [
  { slug: "calendar", label: "Calendar", Component: IconCalendar },
  { slug: "sports", label: "Sports", Component: IconTrophy },
  { slug: "drinks", label: "Drinks", Component: IconMug },
  { slug: "games", label: "Board games", Component: IconDice },
  { slug: "movies", label: "Movies", Component: IconFilm },
  { slug: "outdoors", label: "Outdoors", Component: IconMountains },
  { slug: "food", label: "Food", Component: IconUtensils },
  { slug: "gaming", label: "Gaming", Component: IconGamepad },
  { slug: "camping", label: "Camping", Component: IconTent },
  { slug: "beach", label: "Beach", Component: IconUmbrella },
] as const;

export type GroupIconSlug = (typeof GROUP_ICONS)[number]["slug"];

export function GroupIcon({ icon, ...props }: { icon: string } & IconProps) {
  const entry = GROUP_ICONS.find((i) => i.slug === icon) ?? GROUP_ICONS[0];
  const Component = entry.Component;
  return <Component {...props} />;
}
