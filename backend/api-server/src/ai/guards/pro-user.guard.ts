import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { Role } from '../../user/user.types';

@Injectable()
export class ProUserGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException(
        'Only pro users and admins can access this endpoint',
      );
    }

    // First, try to get role from database (same as /auth/profile does)
    let dbUser = await this.userService.findByEmail(user.email);
    if (!dbUser && user.phone) {
      dbUser = await this.userService.findByPhone(user.phone);
    }
    if (!dbUser && user.id) {
      dbUser = await this.userService.findById(user.id);
    }

    // If user exists in DB, use role from DB
    if (dbUser) {
      if (dbUser.role === Role.Admin || dbUser.role === Role.ProUser) {
        return true;
      }
    }

    // Fallback to JWT claims if DB user not found
    const userRole =
      user?.app_metadata?.role || user?.user_metadata?.role || user?.role;
    if (userRole === Role.ProUser || userRole === Role.Admin) {
      return true;
    }

    throw new ForbiddenException(
      'Only pro users and admins can access this endpoint',
    );
  }
}
