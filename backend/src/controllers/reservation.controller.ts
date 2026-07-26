import { getRouteParam } from '../utils/route-helpers';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ReservationService } from '../services/reservation.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import { ReservationStatus } from '@prisma/client';

const reservationService = new ReservationService();

// Validation schemas
const createReservationSchema = z.object({
  table_id: z.string().cuid('Invalid table ID'),
  reservation_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  reservation_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  party_size: z.number().int().min(1, 'Party size must be at least 1').max(20, 'Party size cannot exceed 20'),
  special_requests: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
});

const availableTablesSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  party_size: z.number().int().min(1).max(20),
});

export class ReservationController {
  async createReservation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const validatedData = createReservationSchema.parse(req.body);
      
      const reservation = await reservationService.createReservation({
        user_id: req.user.id,
        table_id: validatedData.table_id,
        reservation_date: new Date(validatedData.reservation_date),
        reservation_time: validatedData.reservation_time,
        party_size: validatedData.party_size,
        special_requests: validatedData.special_requests,
      });

      // Broadcast new reservation via Socket.io
      const io = req.app.get('io');
      io.to('role:reception').emit('reservation:created', {
        reservationId: reservation.id,
        userName: reservation.customer.name,
        tableNumber: reservation.table.table_number,
        date: reservation.date,
        partySize: reservation.party_size,
      });

      res.status(201).json({
        status: 'success',
        data: reservation,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async getReservationById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const reservation = await reservationService.getReservationById(id);

      res.status(200).json({
        status: 'success',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReservations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const reservations = await reservationService.getUserReservations(req.user.id);

      res.status(200).json({
        status: 'success',
        data: reservations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllReservations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, date } = req.query;

      const filters: any = {};
      if (status) {
        filters.status = status as ReservationStatus;
      }
      if (date) {
        filters.date = new Date(date as string);
      }

      const reservations = await reservationService.getAllReservations(filters);

      res.status(200).json({
        status: 'success',
        data: reservations,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReservationStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getRouteParam(req, 'id');
      const validatedData = updateStatusSchema.parse(req.body);

      const reservation = await reservationService.updateReservationStatus(id, validatedData.status);

      // Broadcast status update via Socket.io
      const io = req.app.get('io');
      io.to('role:reception').emit('reservation:status_updated', {
        reservationId: reservation.id,
        status: reservation.status,
        tableNumber: reservation.table.table_number,
      });

      // Notify customer
      io.to(`user:${reservation.customer_id}`).emit('reservation:status_updated', {
        reservationId: reservation.id,
        status: reservation.status,
      });

      res.status(200).json({
        status: 'success',
        data: reservation,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  async cancelReservation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const id = getRouteParam(req, 'id');
      const reservation = await reservationService.cancelReservation(id, req.user.id);

      // Broadcast cancellation via Socket.io
      const io = req.app.get('io');
      io.to('role:reception').emit('reservation:cancelled', {
        reservationId: reservation.id,
        tableNumber: reservation.table.table_number,
      });

      res.status(200).json({
        status: 'success',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableTables(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = availableTablesSchema.parse({
        date: req.query.date,
        time: req.query.time,
        party_size: parseInt(req.query.party_size as string),
      });

      const tables = await reservationService.getAvailableTables(
        new Date(validatedData.date),
        validatedData.time,
        validatedData.party_size
      );

      res.status(200).json({
        status: 'success',
        data: tables,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }
}
