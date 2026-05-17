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
    return saved;
  }

  async updateFromClerk(user: User, payload: ClerkUserPayload): Promise<User> {
    const email = payload.email_addresses[0]?.email_address;
    if (email) user.email = email;
    if (payload.public_metadata?.role) user.role = payload.public_metadata.role;

    const saved = await this.usersRepository.save(user);
    this.logger.log(`User updated: ${saved.email}`);
    return saved;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByExternalId(externalAuthId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { externalAuthId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }
}
