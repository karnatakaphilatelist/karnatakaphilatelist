import { BookIcon, CompassIcon } from "@/components/ui/icons";

export const NAV_ITEMS = [
  { href: "/explore", label: "Explore", Icon: CompassIcon },
  { href: "/passport", label: "Passport", Icon: BookIcon },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
