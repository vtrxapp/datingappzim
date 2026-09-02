import { Request } from 'express';
import { UserRole } from 'shared';

export interface RequestUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
