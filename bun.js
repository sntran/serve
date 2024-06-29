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

  const server = Bun.serve({
    fetch,
    hostname,
    port,
  });

  signal?.addEventListener("abort", () => {
    server.stop();
  });

  const address = { address: server.hostname, port: server.port };
  onListen?.(address);

  return address;
}
