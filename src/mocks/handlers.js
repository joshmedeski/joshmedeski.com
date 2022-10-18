import { rest } from "msw";

export const handlers = [
  // Netlify Functions
  // Create a subscriber
  rest.post("/login", null),

  // Handles a GET /user request
  rest.get("/user", null),
];
