// routes/chat.routes.ts

import { Router } from "express";

import {
  createRoom,
  addUsersToRoom,
  getUserRooms,
  getRoomDetail,
  updateRoom,
  deleteRoom,
} from "../controllers/chat.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  createRoom
);

router.post(
  "/add-user/:id",
  authMiddleware,
  addUsersToRoom
);

router.get(
  "/",
  authMiddleware,
  getUserRooms
);

router.get(
  "/:id",
  authMiddleware,
  getRoomDetail
);

router.put(
  "/:id",
  authMiddleware,
  updateRoom
);

router.delete(
  "/:id",
  authMiddleware,
  deleteRoom
);

export default router;