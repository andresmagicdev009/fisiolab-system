import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkUserPayload, UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { UserPayload } from '../auth/strategies/jwt.strategy';

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: ClerkUserPayload;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('webhook/clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(@Body() event: ClerkWebhookEvent) {
    if (!event?.type || !event?.data) {
      throw new BadRequestException('Invalid webhook payload');
    }

    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await this.usersService.createFromClerk(event.data);
        break;
      case 'user.deleted':
        break;
    }

    return { received: true };
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user DB record' })
  @UseGuards(JwtAuthGuard)
  async findMe(@Request() req: { user: UserPayload }) {
    const user = await this.usersService.findByExternalId(req.user.userId);
    if (!user) throw new NotFoundException('User not found in DB');
    return user;
  }

  @Get()
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }
}
