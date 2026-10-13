// routes/message.routes.ts

import { Router } from "express";

import {
  sendMessage,
  getRoomMessages,
  getMessageDetail,
  updateMessage,
  deleteMessage,
  markMessageAsRead,
} from "../controllers/message.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  sendMessage
);

router.get(
  "/:roomId",
  authMiddleware,
  getRoomMessages
);

router.get(
  "/:messageId",
  authMiddleware,
  getMessageDetail
);

router.put(
  "/:messageId",
  authMiddleware,
  updateMessage
);

router.delete(
  "/:messageId",
  authMiddleware,
  deleteMessage
);

router.post(
  "/read/:messageId",
  authMiddleware,
  markMessageAsRead
);

export default router;