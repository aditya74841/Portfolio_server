import express from "express";
import {
    googleLogin,
    devAdminLogin,
    logout,
    getCurrentUser,
} from "../controller/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/google", googleLogin);
router.post("/dev", devAdminLogin);
router.post("/logout", protect, logout);
router.get("/me", protect, getCurrentUser);

export default router;
