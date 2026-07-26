import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { authHandler } from '../utils/route-helpers';
import { Role } from '@prisma/client';

const router = Router();
const reservationController = new ReservationController();

// Public route - check available tables (no auth required)
router.get('/available-tables', authHandler(reservationController.getAvailableTables.bind(reservationController)));

// Customer routes (require auth)
router.post('/', authMiddleware, authHandler(reservationController.createReservation.bind(reservationController)));
router.get('/my-reservations', authMiddleware, authHandler(reservationController.getUserReservations.bind(reservationController)));
router.patch('/:id/cancel', authMiddleware, authHandler(reservationController.cancelReservation.bind(reservationController)));

// Reception/Admin routes
router.get(
  '/',
  authMiddleware,
  roleMiddleware([Role.reception, Role.admin]),
  authHandler(reservationController.getAllReservations.bind(reservationController))
);

router.get('/:id', authMiddleware, authHandler(reservationController.getReservationById.bind(reservationController)));

router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware([Role.reception, Role.admin]),
  authHandler(reservationController.updateReservationStatus.bind(reservationController))
);

export default router;
