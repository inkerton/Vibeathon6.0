import bcrypt from 'bcrypt';
import { PrismaClient, Role, AuthProvider, User } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import prisma from '../config/database';

export interface CreateStaffDTO {
  name: string;
  email: string;
  password: string;
  role: 'reception' | 'kitchen' | 'inventory' | 'admin';
  phone?: string;
}

export interface UpdateStaffDTO {
  name?: string;
  email?: string;
  role?: 'reception' | 'kitchen' | 'inventory' | 'admin';
  phone?: string;
}

export interface StaffFilters {
  role?: Role;
  is_active?: boolean;
  search?: string;
  id?: string;
}

export class StaffService {
  /**
   * Get all staff members (excludes customers)
   */
  async getAllStaff(filters?: StaffFilters): Promise<User[]> {
    const where: any = {
      role: {
        not: Role.customer,
      },
    };

    // Apply filters
    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters?.id) {
      where.id = filters.id;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return staff as User[];
  }

  /**
   * Get staff member by ID
   */
  async getStaffById(id: string): Promise<User> {
    const staff = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    if (staff.role === Role.customer) {
      throw new AppError('User is not a staff member', 400);
    }

    return staff as User;
  }

  /**
   * Create new staff member
   */
  async createStaff(data: CreateStaffDTO): Promise<User> {
    // Validate role
    const validRoles: Role[] = [Role.reception, Role.kitchen, Role.inventory, Role.admin];
    if (!validRoles.includes(data.role as Role)) {
      throw new AppError(
        'Invalid role. Must be: reception, kitchen, inventory, or admin',
        400
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    // Create staff member
    const staff = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password_hash,
        auth_provider: AuthProvider.local,
        role: data.role as Role,
        is_active: true, // Staff members are active by default
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
    });

    return staff as User;
  }

  /**
   * Update staff member
   */
  async updateStaff(id: string, data: UpdateStaffDTO): Promise<User> {
    // Check if staff exists
    const existingStaff = await this.getStaffById(id);

    // If email is being updated, check for uniqueness
    if (data.email && data.email !== existingStaff.email) {
      const emailTaken = await this.isEmailTaken(data.email, id);
      if (emailTaken) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Validate role if provided
    if (data.role) {
      const validRoles: Role[] = [Role.reception, Role.kitchen, Role.inventory, Role.admin];
      if (!validRoles.includes(data.role as Role)) {
        throw new AppError(
          'Invalid role. Must be: reception, kitchen, inventory, or admin',
          400
        );
      }
    }

    // Update staff member
    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role as Role }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedStaff as User;
  }

  /**
   * Toggle staff active status
   */
  async toggleStaffStatus(id: string): Promise<User> {
    // Check if staff exists
    const existingStaff = await this.getStaffById(id);

    // If deactivating an admin, check if they're the last admin
    if (existingStaff.role === Role.admin && existingStaff.is_active) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: Role.admin,
          is_active: true,
        },
      });

      if (activeAdminCount <= 1) {
        throw new AppError('Cannot deactivate the last active admin user', 400);
      }
    }

    // Toggle status
    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        is_active: !existingStaff.is_active,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedStaff as User;
  }

  /**
   * Delete staff member (soft delete)
   */
  async deleteStaff(id: string): Promise<void> {
    // Check if staff exists
    const existingStaff = await this.getStaffById(id);

    // If deleting an admin, check if they're the last admin
    if (existingStaff.role === Role.admin) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: Role.admin,
          is_active: true,
        },
      });

      if (activeAdminCount <= 1) {
        throw new AppError('Cannot delete the last admin user', 400);
      }
    }

    // Soft delete by setting is_active to false
    await prisma.user.update({
      where: { id },
      data: {
        is_active: false,
      },
    });
  }

  /**
   * Get staff by role
   */
  async getStaffByRole(role: Role): Promise<User[]> {
    if (role === Role.customer) {
      throw new AppError('Cannot query customers through staff endpoint', 400);
    }

    const staff = await prisma.user.findMany({
      where: {
        role,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return staff as User[];
  }

  /**
   * Check if email is already taken
   */
  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;
    }

    // If excludeId is provided, check if it's the same user
    if (excludeId && user.id === excludeId) {
      return false;
    }

    return true;
  }
}
