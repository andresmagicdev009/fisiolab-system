import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditService } from '../../modules/audit/audit.service';
import { UsersService } from '../../modules/users/users.service';
import { AUDITABLE_KEY } from '../decorators/auditable.decorator';
import { UserPayload } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDITABLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!action) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as UserPayload | undefined;

    if (!user?.userId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        void this.resolveAndLog(user.userId, action, req);
      }),
    );
  }

  private async resolveAndLog(
    clerkId: string,
    action: string,
    req: Request,
  ): Promise<void> {
    const dbUser = await this.usersService.findByExternalId(clerkId);
    if (!dbUser) return;

    await this.auditService.log({
      userId: dbUser.id,
      action,
      resourceId: Array.isArray(req.params?.id) ? req.params.id[0] : req.params?.id,
      metadata: {
        params: req.params,
        body: req.body as Record<string, unknown>,
        method: req.method,
        path: req.path,
      },
    });
  }
}
