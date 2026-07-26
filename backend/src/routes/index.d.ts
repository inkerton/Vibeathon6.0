// By creating this file, we are using declaration merging to add our custom 'user'
// property to the Express Request interface. This provides global type safety
// for `req.user` and resolves the "No overload matches this call" error.

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    export interface User {
      id: string;
      email: string;
      role: Role;
    }
    export interface Request {
      user?: User;
    }
  }
}
