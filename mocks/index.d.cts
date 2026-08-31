// Hand-written types for the CommonJS msw mock. Declaring `server` via
// `msw/node` would pull in msw's CJS type declarations, whose `RequestHandler`
// is a distinct class identity from the ESM one the tests import from `msw` —
// so handlers passed to `use()` would not type-check. This shape covers how
// the mock is actually used.
export declare const server: {
  listen(options?: { onUnhandledRequest?: string }): void
  use(...handlers: unknown[]): void
  resetHandlers(): void
  close(): void
}
