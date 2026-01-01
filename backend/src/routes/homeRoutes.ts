import { Router } from "express";
import { lambdaAdapter } from "../local/lambdaAdapter";
import { handler as homeHandler } from "../handlers/home";

const router = Router();

// GET /api/home/:userId (Lambda-style adapter)
const dummyContext = {
	awsRequestId: "local-dev"
} as any;

router.get("/:userId", async (req, res, next) => {
	try {
		const event = {
			pathParameters: { userId: req.params.userId }
		};
		const raw = await homeHandler(event as any, dummyContext);
		const result = lambdaAdapter(raw);
		res.status(result.statusCode).set(result.headers).send(result.body);
	} catch (err) {
		next(err);
	}
});

export default router;
