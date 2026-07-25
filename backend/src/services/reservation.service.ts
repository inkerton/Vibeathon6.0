import { PrismaClient, ReservationStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import prisma from '../config/database';
import { sendReservationConfirmation } from '../utils/email.util';

export class ReservationService {
  async createReservation(data: {
    user_id: string;
    table_id: string;
    reservation_date: Date;
    reservation_time: string;
    party_size: number;
    special_requests?: string;
  }) {
    // Combine date and time into single DateTime
    const reservationDateTime = new Date(`${data.reservation_date.toISOString().split('T')[0]}T${data.reservation_time}:00.000Z`);
    
    // Check if table exists and is available
    const table = await prisma.table.findUnique({
      where: { id: data.table_id },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    if (table.capacity < data.party_size) {
      throw new AppError(`Table capacity (${table.capacity}) is less than party size (${data.party_size})`, 400);
    }

    // Check for conflicting reservations (within 2 hours window)
    const twoHoursBefore = new Date(reservationDateTime.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(reservationDateTime.getTime() + 2 * 60 * 60 * 1000);

    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        table_id: data.table_id,
        date: {
          gte: twoHoursBefore,
          lte: twoHoursAfter,
        },
        status: {
          in: [ReservationStatus.pending, ReservationStatus.confirmed],
        },
      },
    });

    if (conflictingReservation) {
      throw new AppError('Table is already reserved for this time slot', 409);
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        customer_id: data.user_id,
        table_id: data.table_id,
        date: reservationDateTime,
        party_size: data.party_size,
        special_request: data.special_requests,
        status: ReservationStatus.pending,
      },
      include: {
        customer: true,
        table: true,
      },
    });

    // Send confirmation email
    try {
      await sendReservationConfirmation(
        reservation.customer.email,
        reservation.customer.name,
        {
          date: reservation.date.toLocaleDateString(),
          time: data.reservation_time,
          partySize: reservation.party_size,
          tableNumber: reservation.table.table_number,
        }
      );
    } catch (emailError) {
      console.error('Failed to send reservation confirmation email:', emailError);
      // Don't fail the reservation if email fails
    }

    return reservation;
  }

  async getReservationById(id: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        table: true,
      },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    return reservation;
  }

  async getUserReservations(userId: string) {
    const reservations = await prisma.reservation.findMany({
      where: { customer_id: userId },
      include: {
        table: true,
      },
      orderBy: [
        { date: 'desc' },
      ],
    });

    return reservations;
  }

  async getAllReservations(filters?: {
    status?: ReservationStatus;
    date?: Date;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.date) {
      where.date = filters.date;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        table: true,
      },
      orderBy: [
        { date: 'asc' },
      ],
    });

    return reservations;
  }

  async updateReservationStatus(id: string, status: ReservationStatus) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        table: true,
      },
    });

    return updated;
  }

  async cancelReservation(id: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    if (reservation.customer_id !== userId) {
      throw new AppError('You can only cancel your own reservations', 403);
    }

    if (reservation.status === ReservationStatus.cancelled) {
      throw new AppError('Reservation is already cancelled', 400);
    }

    if (reservation.status === ReservationStatus.completed) {
      throw new AppError('Cannot cancel completed reservation', 400);
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.cancelled },
      include: {
        table: true,
      },
    });

    return updated;
  }

  async getAvailableTables(date: Date, time: string, partySize: number) {
    // Get all tables that can accommodate the party size
    const tables = await prisma.table.findMany({
      where: {
        capacity: {
          gte: partySize,
        },
        status: 'free',
      },
    });

    // Check which tables are already reserved for this time slot
    const requestedDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}:00.000Z`);
    const twoHoursBefore = new Date(requestedDateTime.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(requestedDateTime.getTime() + 2 * 60 * 60 * 1000);

    const reservedTableIds = await prisma.reservation.findMany({
      where: {
        date: {
          gte: twoHoursBefore,
          lte: twoHoursAfter,
        },
        status: {
          in: [ReservationStatus.pending, ReservationStatus.confirmed],
        },
      },
      select: {
        table_id: true,
      },
    });

    const reservedIds = new Set(reservedTableIds.map(r => r.table_id));
    const availableTables = tables.filter(table => !reservedIds.has(table.id));

    return availableTables;
  }
}
