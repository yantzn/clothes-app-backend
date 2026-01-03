import { Router } from "express";
import { getHomeHandler } from "../controllers/homeController";

const router = Router();

// GET /api/home/:userId
router.get("/:userId", getHomeHandler);

export default router;
