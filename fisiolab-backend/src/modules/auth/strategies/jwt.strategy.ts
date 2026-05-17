import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface JwtPayload {
  sub: string;
  email?: string;
  publicMetadata?: { role?: string };
  public_metadata?: { role?: string };
  sid?: string;
  azp?: string;
}

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const jwksUri = configService.get<string>('CLERK_JWKS_URI');
    if (!jwksUri) {
      throw new Error('CLERK_JWKS_URI not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    this.logger.debug(`JWT payload: ${JSON.stringify(payload)}`);

    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido: sin sub');
    }

    // All roles managed in Clerk publicMetadata — read directly from JWT
    const role = payload.publicMetadata?.role ?? payload.public_metadata?.role ?? 'paciente';

    return {
      userId: payload.sub,
      email: payload.email ?? '',
      role,
    };
  }
}
