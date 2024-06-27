# serve

Provides a common HTTP server API for all platforms.

## Examples

```js
import { serve } from "@sntran/serve";

const server = serve({
  fetch(request) {
    return new Response("Hello, world!");
  },
  hostname: "0.0.0.0",
  port: 8080,
  onListen({ hostname, port }) {
    console.log(`Server running at http://${hostname}:${port}`);
  },
});
```
