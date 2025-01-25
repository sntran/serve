# serve

Provides a common HTTP server API for all runtimes. Currently supports Node.js,
Deno, Bun, and Cloudflare Workers (no-op).

## Why?

Different runtimes have different APIs for creating HTTP servers. For Node.js,
`http.createServer` takes a handler with its own incoming and outgoing message
objects. `Deno.serve` takes a handler with web standard `Request` and `Response`
objects. `Bun.serve` takes an object with a `fetch` method, similar to
Cloudflare Workers. Workers, however, handle the serving.

This library takes the most common denominator of these APIs and provides a
`serve` API that can be used across all runtimes. Similar to Bun and Cloudflare
Workers, it takes an object with `fetch` function. The abstration across
runtimes are handled by conditional exports defined in `package.json`.

The default uses Node.js's `http.createServer` and normalizes the incoming and
outgoing messages to web standard `Request` and `Response` objects, and let
`Deno` polyfill to `Deno.serve`.

A separate export for `Bun` to explicitly use `Bun.serve`.

For Cloudflare Workers, it's a no-op, provided to avoid runtime errors. To
re-use codebase, it is recommend to export the handler object in the `default`
export.

## Examples

```js
import { serve } from "@sntran/serve";

const abortController = new AbortController();

const handler = {
  fetch(request) {
    return new Response("Hello, world!");
  },
  hostname: "0.0.0.0",
  port: 8080,
  signal: abortController.signal,
  onListen({ hostname, port }) {
    console.log(`Server running at http://${hostname}:${port}`);
  },
  // Other options are passed to the underlying server.
  // For Node.js, it's passed to `http.createServer`.
  keepAlive: true,
  keepAliveTimeout: 5000, // milliseconds
  // For Bun, it's passed to `Bun.serve`.
  idleTimeout: 5, // seconds
};

export default handler;

const server = serve(handler);

// To stop the server
abortController.abort();
```
