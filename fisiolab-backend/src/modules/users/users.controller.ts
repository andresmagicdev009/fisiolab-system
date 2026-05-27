import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkUserPayload, UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
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
  @ApiOperation({ summary: 'Get current authenticated user profile with hasAvailability flag' })
  @UseGuards(JwtAuthGuard)
  async findMe(@Request() req: { user: UserPayload }) {
    const user = await this.usersService.findMeWithAvailability(req.user.userId);
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

  @Patch(':id')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Update user (capacity). ADMIN puede actualizar cualquier usuario; profesionales solo el propio.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: UserPayload },
  ) {
    if (dto.capacidadAtencionParalela === undefined) {
      throw new BadRequestException('Sin cambios — provee capacidadAtencionParalela');
    }
    return this.usersService.updateCapacidad(
      id,
      dto.capacidadAtencionParalela,
      req.user.userId,
      req.user.role,
    );
  }
}
