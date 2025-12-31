import { Router, Response } from 'express';
import { register, login } from '../controllers/auth.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    message: 'Authenticated user',
    user: req.user,
  });
});

export default router;