import { Router } from "express";
import { createProfile, updateProfile, replaceFamily, getProfile } from "../controllers/profileController";
const router = Router();

router.post("/", createProfile);

router.patch("/:userID", updateProfile);

router.put("/:userID", replaceFamily);

router.get("/:userID", getProfile);

export default router;
