import { Router } from "express";
import { getHourly } from "../controllers/weatherController";

const router = Router();

// GET /api/weather/hourly/:userId
router.get("/hourly/:userId", getHourly);

export default router;
