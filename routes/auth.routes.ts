// routes/auth.routes.ts

import { Router } from "express";

import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  getUsers,
  refreshAccessToken,
} from "../controllers/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.post(
  "/refresh-token",
  refreshAccessToken
);

router.post("/logout", logout);
router.get("/profile", authMiddleware, getProfile);

router.put("/update-profile", authMiddleware, updateProfile);

router.post(
  "/update-password",
  authMiddleware,
  updatePassword
);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/users", authMiddleware, getUsers);

export default router;