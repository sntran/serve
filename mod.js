import { createServer } from "node:http";

/**
 * @typedef {(request: Request) => Response | Promise<Response>} Fetch
 */

/**
 * @typedef {Object} Server
 * @property {string} hostname
 * @property {number} port
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
 * @param {function(Server): void} [handler.onListen]
 * @returns {Server}
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
    ...options
  } = handler;

  const server = createServer(options, async (incoming, outgoing) => {
    // Converts Node's `IncomingMessage` to web `Request`.
    let { url, headers, method } = incoming;
    const abortController = new AbortController();
    headers = new Headers(headers);
    url = new URL(url, `http://${headers.get("Host")}`);

    incoming.once("aborted", () => abortController.abort());

    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      body = new ReadableStream({
        start(controller) {
          incoming.on("data", (chunk) => {
            controller.enqueue(chunk);
          });
          incoming.on("end", () => {
            controller.close();
          });
        },
      });
    }

    const request = new Request(url, {
      method,
      headers,
      body,
      signal: abortController.signal,
      duplex: "half", // required by Node.js since it does not support full duplex
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
