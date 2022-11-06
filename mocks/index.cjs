const { rest } = require("msw");
const { setupServer } = require("msw/node");

const server = setupServer(
  rest.post("https://api.buttondown.email/v1/subscribers", (req, res, ctx) => {
    return res(
      ctx.json({
        creation_date: "2022-10-24T19:21:28.855Z",
        email: req.json.email,
        id: "13399cbd-37a6-40f0-9d64-7b580a31ef02",
        notes: "",
        referrer_url: req.json.referrer_url,
        metadata: {},
        secondary_id: 20,
        subscriber_type: "regular",
        source: "api",
        tags: [],
        utm_campaign: "",
        utm_medium: "",
        utm_source: "",
      })
    );
  })
);

server.listen({ onUnhandledRequest: "bypass" });
console.info("🔶 Mock server running");

process.once("SIGINT", () => server.close());
process.once("SIGTERM", () => server.close());
