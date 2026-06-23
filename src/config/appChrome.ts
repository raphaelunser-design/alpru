const ROUTE_OWNED_CHROME_PREFIXES = [
  "/results",
  "/resorts",
  "/resort",
  "/trips",
  "/checklist",
  "/account",
  "/feedback",
  "/quiz",
  "/map",
  "/admin",
] as const;

const IMMERSIVE_ROUTE_PATHS = ["/karte/3d"] as const;

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function usesRouteOwnedChrome(pathname: string) {
  return ROUTE_OWNED_CHROME_PREFIXES.some((route) => matchesRoutePrefix(pathname, route));
}

export function usesImmersiveShell(pathname: string) {
  return IMMERSIVE_ROUTE_PATHS.includes(pathname as (typeof IMMERSIVE_ROUTE_PATHS)[number]);
}

export function hidesGlobalHeader(pathname: string) {
  return pathname === "/" || usesRouteOwnedChrome(pathname) || usesImmersiveShell(pathname);
}

export function hidesGlobalMobileNav(pathname: string) {
  return pathname === "/" || usesRouteOwnedChrome(pathname) || usesImmersiveShell(pathname);
}

export function hidesGlobalFooter(pathname: string) {
  return usesRouteOwnedChrome(pathname) || usesImmersiveShell(pathname);
}
