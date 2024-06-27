import { createServer } from "node:http";

/**
 * @typedef {(request: Request) => Response | Promise<Response>} Fetch
 */

/**
 * Serves HTTP
 *
 * Examples:
 *
 * ```js
 * import { serve } from "./mod.js";
 * serve({
 *   fetch(request) {
 *     return new Response("Hello!");
 *   }),
 *   port: 8080,
 * });
 * ```
 *
 * @param {Object} handler
 * @param {Fetch} handler.fetch
 * @param {string} [handler.hostname]
 * @param {number} [handler.port]
 * @param {AbortSignal} [handler.signal]
 * @returns {{ hostname: string, port: number }}
 */
export function serve(handler) {
  const {
    fetch,
    hostname = "0.0.0.0",
    port = 0,
    signal,
    onListen = ({ hostname, port }) => {
      console.log(`Listening on http://${hostname}:${port}`);
    },
  } = handler;

  const server = createServer(async (incoming, outgoing) => {
    // Converts Node's `IncomingMessage` to web `Request`.
    let { url, headers, method, body } = incoming;
    const abortController = new AbortController();
    headers = new Headers(headers);
    url = new URL(url, `http://${headers.get("Host")}`);

    incoming.once("aborted", () => abortController.abort());

    const request = new Request(url, {
      method,
      headers,
      body,
      signal: abortController.signal,
    });

    const response = await fetch(request);

    response.headers.forEach((v, k) => outgoing.setHeader(k, v));
    outgoing.writeHead(response.status, response.statusText);

    if (response.body) {
      for await (const chunk of response.body) {
        outgoing.write(chunk);
      }
    }

    outgoing.end();
  });

  signal?.addEventListener("abort", () => {
    server.close();
  });

  const address = { hostname, port };

  server.listen(port, hostname, () => {
    const info = server.address();
    address.port = info.port;
    address.hostname = info.address;

    onListen?.(address);
  });

  return address;
}
