import { Router } from "express";
import { handler } from "../handlers/profile";
import { lambdaAdapter } from "../local/lambdaAdapter";
const router = Router();

const dummyContext = {
  awsRequestId: "local-dev",
} as any;

router.post("/", async (req, res, next) => {
  try {
    const event = {
      body: JSON.stringify(req.body),
      requestContext: { http: { method: req.method } }
    };
    const raw = await handler(event as any, dummyContext);
    const result = lambdaAdapter(raw);

    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (err) {
    next(err);
  }
});

router.patch("/:userID", async (req, res, next) => {
  try {
    const event = {
      body: JSON.stringify(req.body),
      requestContext: { http: { method: req.method } },
      pathParameters: { userId: req.params.userID }
    };
    const raw = await handler(event as any, dummyContext);
    const result = lambdaAdapter(raw);

    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (err) {
    next(err);
  }
});

router.put("/:userID", async (req, res, next) => {
  try {
    const event = {
      body: JSON.stringify(req.body),
      requestContext: { http: { method: req.method } },
      pathParameters: { userId: req.params.userID }
    };
    const raw = await handler(event as any, dummyContext);
    const result = lambdaAdapter(raw);

    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (err) {
    next(err);
  }
});

router.get("/:userID", async (req, res, next) => {
  try {
    const event = {
      requestContext: { http: { method: req.method } },
      pathParameters: { userId: req.params.userID }
    };
    const raw = await handler(event as any, dummyContext);
    const result = lambdaAdapter(raw);

    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (err) {
    next(err);
  }
});

export default router;
