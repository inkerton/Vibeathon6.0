import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { StaffService, CreateStaffDTO, UpdateStaffDTO, StaffFilters } from '../services/staff.service';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import { Role } from '@prisma/client';

const staffService = new StaffService();

// Validation schemas
const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['reception', 'kitchen', 'inventory', 'admin'], {
    errorMap: () => ({ message: 'Role must be one of: reception, kitchen, inventory, admin' }),
  }),
  phone: z.string().optional().transform(val => val === '' ? undefined : val),
});

const updateStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['reception', 'kitchen', 'inventory', 'admin'], {
    errorMap: () => ({ message: 'Role must be one of: reception, kitchen, inventory, admin' }),
  }).optional(),
  phone: z.string().optional().nullable(),
});

const staffFiltersSchema = z.object({
  role: z.enum(['reception', 'kitchen', 'inventory', 'admin']).optional(),
  is_active: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
});

export class StaffController {
  /**
   * GET /staff - Get all staff members
   */
  async getAllStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Parse and validate query parameters
      const filters: StaffFilters = {};
      
      if (req.query.role) {
        filters.role = req.query.role as Role;
      }
      
      if (req.query.is_active !== undefined) {
        filters.is_active = req.query.is_active === 'true';
      }
      
      if (req.query.search) {
        filters.search = req.query.search as string;
      }
      
      if (req.query.id) {
        filters.id = req.query.id as string;
      }

      const staff = await staffService.getAllStaff(filters);

      res.status(200).json({
        status: 'success',
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /staff/:id - Get staff member by ID
   */
  async getStaffById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new AppError('Staff ID is required', 400);
      }

      const staff = await staffService.getStaffById(id);

      res.status(200).json({
        status: 'success',
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /staff - Create new staff member
   */
  async createStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createStaffSchema.parse(req.body);
      
      const staff = await staffService.createStaff(validatedData as CreateStaffDTO);

      res.status(201).json({
        status: 'success',
        message: 'Staff member created successfully',
        data: staff,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  /**
   * PATCH /staff/:id - Update staff member
   */
  async updateStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new AppError('Staff ID is required', 400);
      }

      // Prevent admins from modifying their own account through this endpoint
      if (req.user && req.user.id === id) {
        throw new AppError('Cannot modify your own account through staff management', 400);
      }

      const validatedData = updateStaffSchema.parse(req.body);

      // Check if there's any data to update
      if (Object.keys(validatedData).length === 0) {
        throw new AppError('No update data provided', 400);
      }

      const staff = await staffService.updateStaff(id, validatedData as UpdateStaffDTO);

      res.status(200).json({
        status: 'success',
        message: 'Staff member updated successfully',
        data: staff,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  }

  /**
   * PATCH /staff/:id/status - Toggle staff active status
   */
  async toggleStaffStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new AppError('Staff ID is required', 400);
      }

      // Prevent admins from deactivating themselves
      if (req.user && req.user.id === id) {
        throw new AppError('Cannot modify your own status', 400);
      }

      const staff = await staffService.toggleStaffStatus(id);

      res.status(200).json({
        status: 'success',
        message: `Staff member ${staff.is_active ? 'activated' : 'deactivated'} successfully`,
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /staff/:id - Delete staff member (soft delete)
   */
  async deleteStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new AppError('Staff ID is required', 400);
      }

      // Prevent admins from deleting themselves
      if (req.user && req.user.id === id) {
        throw new AppError('Cannot delete your own account', 400);
      }

      await staffService.deleteStaff(id);

      res.status(200).json({
        status: 'success',
        message: 'Staff member deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
