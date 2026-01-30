import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '../../user/user.types';

@Injectable()
export class ProUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user || (user.role !== Role.ProUser && user.role !== Role.Admin)) {
      throw new ForbiddenException('Only pro users and admins can access this endpoint');
    }

    return true;
  }
}
