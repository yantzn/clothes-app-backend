import { Router } from "express";
import { handler as weatherHandler } from "../handlers/weather";
import { lambdaAdapter } from "../local/lambdaAdapter";

const router = Router();

const dummyContext = {
	awsRequestId: "local-dev"
} as any;

// GET /api/weather/hourly/:userId
router.get("/hourly/:userId", async (req, res, next) => {
	try {
		const event = {
			requestContext: { http: { method: req.method } },
			pathParameters: { userId: req.params.userId },
			queryStringParameters: req.query as any
		};
		const raw = await weatherHandler(event as any, dummyContext);
		const result = lambdaAdapter(raw);
		res.status(result.statusCode).set(result.headers).send(result.body);
	} catch (err) {
		next(err);
	}
});

export default router;
