import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserPayload } from '../../modules/auth/strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPayload => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user as UserPayload;
  },
);
