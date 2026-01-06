import { Router } from "express";
import { createProfile, updateProfile, getProfile } from "../controllers/profileController";
const router = Router();

router.post("/", createProfile);

router.patch("/:userID", updateProfile);

router.get("/:userID", getProfile);

export default router;
