// routes/weatherRoutes.ts
import { Router } from "express";
import { handler } from "../handlers/getWeather.js";
import { lambdaAdapter } from "../local/lambdaAdapter.js";

const router = Router();

const dummyContext = {
  awsRequestId: "local-dev",
} as any;

router.get("/", async (req, res, next) => {
  try {
    const event = {
      queryStringParameters: req.query as Record<string, string>
    };
    const raw = await handler(event as any, dummyContext);
    const result = lambdaAdapter(raw);
    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (err) {
    next(err);
  }
});

export default router;
