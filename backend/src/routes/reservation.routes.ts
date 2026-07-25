import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();
const reservationController = new ReservationController();

// Public route - check available tables (no auth required)
router.get('/available-tables', reservationController.getAvailableTables.bind(reservationController));

// All other reservation routes require authentication
router.use(authMiddleware);

// Customer routes
router.post('/', reservationController.createReservation.bind(reservationController));
router.get('/my-reservations', reservationController.getUserReservations.bind(reservationController));
router.patch('/:id/cancel', reservationController.cancelReservation.bind(reservationController));

// Reception/Admin routes
router.get(
  '/',
  roleMiddleware([Role.reception, Role.admin]),
  reservationController.getAllReservations.bind(reservationController)
);

router.get(
  '/:id',
  reservationController.getReservationById.bind(reservationController)
);

router.patch(
  '/:id/status',
  roleMiddleware([Role.reception, Role.admin]),
  reservationController.updateReservationStatus.bind(reservationController)
);

module.exports = router;
