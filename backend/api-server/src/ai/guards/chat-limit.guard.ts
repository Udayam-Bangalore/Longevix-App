import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { Role } from '../../user/user.types';

@Injectable()
export class ChatLimitGuard implements CanActivate {
  private readonly CHAT_LIMIT = 5;

  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user is admin or pro-user (unlimited access)
    let dbUser = await this.userService.findByEmail(user.email);
    if (!dbUser && user.phone) {
      dbUser = await this.userService.findByPhone(user.phone);
    }
    if (!dbUser && user.id) {
      dbUser = await this.userService.findById(user.id);
    }

    // If user is admin or pro-user, allow unlimited access
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

    // Check chat limit for normal users
    const chatCount = dbUser?.chatUsageCount || 0;
    if (chatCount >= this.CHAT_LIMIT) {
      throw new ForbiddenException(
        `You've reached your limit of ${this.CHAT_LIMIT} AI chat prompts. Upgrade to Pro for unlimited access.`,
      );
    }

    // Increment chat count (in production, this should be atomic and persisted)
    if (dbUser) {
      await this.userService.incrementChatCount(dbUser.id);
    }

    return true;
  }
}
