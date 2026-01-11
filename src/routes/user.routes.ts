import { Router } from 'express';
import { createUser, updateUser, findUser, listUsersByRole } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '../types/auth';

const router = Router();

router.post('/', authenticate, authorize(Role.ADMIN), createUser);
router.get('/search', authenticate, findUser);
router.get('/role/:role', authenticate, listUsersByRole);
router.put('/:id', authenticate, authorize(Role.ADMIN), updateUser);

export default router;