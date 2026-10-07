export function resolveTabletopSocketOrigin(apiBaseUrl: string | undefined, pageOrigin: string): string {
  return new URL(apiBaseUrl?.trim() || pageOrigin, pageOrigin).origin;
}
