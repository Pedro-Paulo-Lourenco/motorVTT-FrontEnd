export function resolveTabletopSocketOrigin(apiBaseUrl: string | undefined, pageOrigin: string): string {
  // Socket.IO precisa da origem, não do caminho da API; URLs relativas usam a origem da página.
  return new URL(apiBaseUrl?.trim() || pageOrigin, pageOrigin).origin;
}
