import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Logout user
router.post('/logout', logout);

export default router; 