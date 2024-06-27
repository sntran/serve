// Do nothing. Cloudflare Worker has no server API.

export function serve(handler) {
  const { hostname, port } = handler;
  return { hostname, port };
}
