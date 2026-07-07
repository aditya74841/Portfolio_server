import express from "express";
import {
    register,
    emailLogin,
    googleLogin,
    devAdminLogin,
    logout,
    getCurrentUser,
    pinLogin,
    forgotPassword,
    resetPassword,
    changePassword,
    setPin,
    verifyPin,
    checkPinSession,
    changeAvatar,
    removeAvatar,
    updateProfile,
} from "../controller/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/register", register);
router.post("/email-login", emailLogin);
router.post("/google", googleLogin);
router.post("/dev", devAdminLogin);
router.post("/pin-login", pinLogin);          // Legacy
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes (auth required)
router.get("/me", protect, getCurrentUser);
router.post("/logout", protect, logout);
router.post("/set-pin", protect, setPin);
router.post("/verify-pin", protect, verifyPin);
router.get("/pin-session", protect, checkPinSession);
router.put("/change-password", protect, changePassword);
router.put("/avatar", protect, upload.single("avatar"), changeAvatar);
router.delete("/avatar", protect, removeAvatar);
router.put("/update-profile", protect, updateProfile);

export default router;
