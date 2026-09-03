export function normalizePath(path: string) {
  const withoutHash = path.split("#")[0] ?? path;
  const [pathname] = withoutHash.split("?");
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function destinationPath(href: unknown): string | null {
  if (typeof href === "string") {
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return null;
    }
    if (href.startsWith("http://") || href.startsWith("https://")) {
      try {
        const url = new URL(href);
        if (
          typeof window !== "undefined" &&
          url.origin !== window.location.origin
        ) {
          return null;
        }
        return `${url.pathname}${url.search}`;
      } catch {
        return null;
      }
    }
    return href.split("#")[0] ?? href;
  }

  if (href && typeof href === "object" && "pathname" in href) {
    const record = href as {
      pathname?: string | null;
      protocol?: string | null;
    };
    if (
      record.protocol &&
      record.protocol !== "http:" &&
      record.protocol !== "https:"
    ) {
      return null;
    }
    return record.pathname ?? "";
  }

  return null;
}
