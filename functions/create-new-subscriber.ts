import { Handler } from "@netlify/functions";

type Body = {
  email: string;
  metadata: {};
  notes: string;
  referrer_url: string;
  tags: string[];
};

type Response = {
  creation_date: Date;
  email: string;
  id: string;
  metadata: {};
  notes: string;
  referrer_url: string;
  secondary_id: number;
  source: "api";
  subscriber_type: "regular";
  tags: string[];
  utm_campaign: string;
  utm_medium: string;
  utm_source: string;
};

export const verifyValidEmail = (email: string | null) => {
  if (!email) throw new Error("Email is required");
  if (
    email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    return email;
  } else {
    throw new Error("Email is invalid");
  }
};

const createNewSubscriber = async (body: Body) => {
  try {
    return await fetch("https://api.buttondown.email/v1/subscribers", {
      headers: {
        content_type: "application/json",
        Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then((body) => body as Response);
  } catch (error) {
    throw new Error("Error creating subscriber");
  }
};

const handler: Handler = async (event) => {
  try {
    if (!event.body) throw new Error("Body is required");
    const parsedBody = JSON.parse(event.body) as Body;
    verifyValidEmail(parsedBody.email);
    const createdSubscriber = await createNewSubscriber(parsedBody);
    return {
      statusCode: 201,
      body: JSON.stringify(createdSubscriber),
    };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return {
        statusCode: 500,
        body: e?.message,
      };
    } else {
      return {
        statusCode: 500,
        body: "Error creating subscriber",
      };
    }
  }
};

export { handler };
