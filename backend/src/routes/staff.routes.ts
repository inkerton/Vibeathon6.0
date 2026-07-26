import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';

const router = Router();
const staffController = new StaffController();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Staff CRUD operations
router.get('/', authHandler(staffController.getAllStaff.bind(staffController)));
router.get('/:id', authHandler(staffController.getStaffById.bind(staffController)));
router.post('/', authHandler(staffController.createStaff.bind(staffController)));
router.patch('/:id', authHandler(staffController.updateStaff.bind(staffController)));
router.patch('/:id/status', authHandler(staffController.toggleStaffStatus.bind(staffController)));
router.delete('/:id', authHandler(staffController.deleteStaff.bind(staffController)));

export default router;
