import { Router } from 'express';
import { updateUser, findUser } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../types/auth';

const router = Router();

router.get('/search', authenticate, findUser);
router.put('/:id', authenticate, authorize(Role.ADMIN), updateUser);

export default router;