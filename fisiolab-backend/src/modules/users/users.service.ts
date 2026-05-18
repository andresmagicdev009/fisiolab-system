import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums/roles.enum';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';

export interface ClerkUserPayload {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  public_metadata: { role?: string };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  async createFromClerk(payload: ClerkUserPayload): Promise<User> {
    const email = payload.email_addresses[0]?.email_address;
    if (!email) throw new ConflictException('Clerk payload missing email');

    const existing = await this.usersRepository.findOne({
      where: { externalAuthId: payload.id },
    });

    if (existing) return this.updateFromClerk(existing, payload);

    const user = this.usersRepository.create({
      email,
      externalAuthId: payload.id,
      role: payload.public_metadata?.role ?? UserRole.PACIENTE,
    });

    const saved = await this.usersRepository.save(user);
    this.logger.log(`User created: ${saved.email}`);

    await this.redis.del(CK.USERS_ALL);
    return saved;
  }

  async updateFromClerk(user: User, payload: ClerkUserPayload): Promise<User> {
    const email = payload.email_addresses[0]?.email_address;
    if (email) user.email = email;
    if (payload.public_metadata?.role) user.role = payload.public_metadata.role;

    const saved = await this.usersRepository.save(user);
    this.logger.log(`User updated: ${saved.email}`);

    const keysToInvalidate = [CK.USER_ID(saved.id), CK.USER_EMAIL(saved.email), CK.USERS_ALL];
    if (saved.externalAuthId) keysToInvalidate.push(CK.USER_EXT(saved.externalAuthId));
    await this.redis.del(...keysToInvalidate);
    return saved;
  }

  async findAll(): Promise<User[]> {
    const cached = await this.redis.get<User[]>(CK.USERS_ALL);
    if (cached) return cached;

    const users = await this.usersRepository.find();
    await this.redis.set(CK.USERS_ALL, users, TTL.LIST);
    return users;
  }

  async findById(id: string): Promise<User> {
    const cached = await this.redis.get<User>(CK.USER_ID(id));
    if (cached) return cached;

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    await this.redis.set(CK.USER_ID(id), user, TTL.USER);
    return user;
  }

  async findByExternalId(externalAuthId: string): Promise<User | null> {
    const cached = await this.redis.get<User>(CK.USER_EXT(externalAuthId));
    if (cached) return cached;

    const user = await this.usersRepository.findOne({ where: { externalAuthId } });
    if (user) await this.redis.set(CK.USER_EXT(externalAuthId), user, TTL.USER);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cached = await this.redis.get<User>(CK.USER_EMAIL(email));
    if (cached) return cached;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) await this.redis.set(CK.USER_EMAIL(email), user, TTL.USER);
    return user;
  }
}
