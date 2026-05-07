import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { statusCode: 429, message: 'Too many requests, please try again later.', errorCode: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

router.post('/signup', (req, res) => authController.signup(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', protect, (req, res) => authController.me(req, res));

export default router;
