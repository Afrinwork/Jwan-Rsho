import { colors } from "@/src/constants/colors";

// Fixed hex values (not theme tokens) — these mark a specific route/data
// state on the map, not app chrome, so they must stay the same in light and
// dark mode. PIN_IMPRECISE matches CustomerMarker's PIN_YELLOW so "no street
// address on file" means the same color everywhere in the app.
const PIN_SKIPPED = "#F97316";
const PIN_IMPRECISE = "#EAB308";
const PIN_COMPLETED = "#6B7280";

export type RouteStopMarkerStyleInput = {
  active: boolean;
  // Already completed or skipped — stays on the map (never removed), just
  // rendered muted so it visually recedes behind the upcoming stops.
  inactive?: boolean;
  // Only meaningful together with inactive=true: distinguishes "couldn't be
  // completed, still needs a revisit" from "done" — both stay on the map,
  // but a driver needs to tell them apart at a glance.
  skipped?: boolean;
  // City-only address (no street on file) — same imprecise-location signal
  // as the plain customer map, shown as its own color so it stands out.
  hasStreetAddress?: boolean;
};

export type RouteStopMarkerStyle = {
  backgroundColor: string;
  borderColor: string;
  opacity: number;
  scale: number;
};

// Priority (highest first): active > skipped > completed > imprecise address
// > default. Route progress is more useful to a driver mid-delivery than
// address precision, so it wins whenever both would otherwise apply.
export function resolveRouteStopMarkerStyle(input: RouteStopMarkerStyleInput): RouteStopMarkerStyle {
  if (input.active) {
    return { backgroundColor: colors.danger, borderColor: colors.dangerBorder, opacity: 1, scale: 1.15 };
  }

  if (input.inactive) {
    return input.skipped
      ? { backgroundColor: PIN_SKIPPED, borderColor: colors.surface, opacity: 0.85, scale: 1 }
      : { backgroundColor: PIN_COMPLETED, borderColor: colors.surface, opacity: 0.6, scale: 1 };
  }

  if (input.hasStreetAddress === false) {
    return { backgroundColor: PIN_IMPRECISE, borderColor: colors.surface, opacity: 1, scale: 1 };
  }

  return { backgroundColor: colors.primary, borderColor: colors.surface, opacity: 1, scale: 1 };
}
