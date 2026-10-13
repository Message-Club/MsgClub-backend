import express from 'express';
import authRoutes from './auth.routes.js';
import chatRoutes from './chat.routes.js';
import messageRoutes from './message.routes.js';

const router = express.Router();

// Define your routes here
router.use('/users', authRoutes);
router.use('/chat', chatRoutes);
router.use('/messages', messageRoutes);

export default router;