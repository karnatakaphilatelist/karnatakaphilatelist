import { BookIcon, CompassIcon, UserIcon } from "@/components/ui/icons";

export const NAV_ITEMS = [
  { href: "/explore", label: "Explore", Icon: CompassIcon, phoneOnly: false },
  { href: "/passport", label: "Passport", Icon: BookIcon, phoneOnly: false },
  // On phones the account lives in the tab bar; on larger screens the header has it.
  { href: "/account", label: "Account", Icon: UserIcon, phoneOnly: true },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
