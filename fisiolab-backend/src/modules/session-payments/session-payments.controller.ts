import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SessionPaymentsService } from './session-payments.service';
import { UpdateSessionPaymentDto } from './dto/update-session-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { SessionPayment } from './entities/session-payment.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Payments')
@ApiBearerAuth('JWT')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionPaymentsController {
  constructor(private readonly service: SessionPaymentsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @Auditable('LIST_ALL_PAYMENTS')
  @ApiOperation({ summary: 'Listar todos los pagos (solo ADMIN)' })
  @ApiOkResponse({ description: 'Lista paginada de pagos' })
  findAll(@Query() query: PaymentQueryDto): Promise<PaginatedResponseDto<SessionPayment>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(...READERS)
  @Auditable('READ_PAYMENT')
  @ApiOperation({ summary: 'Obtener pago por ID' })
  @ApiParam({ name: 'id', description: 'UUID del pago' })
  @ApiOkResponse({ description: 'Pago encontrado', type: SessionPayment })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SessionPayment> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(...WRITERS)
  @Auditable('UPDATE_PAYMENT')
  @ApiOperation({ summary: 'Registrar pago (State Pattern: PENDIENTE→PAGADO|PARCIAL, PARCIAL→PAGADO)' })
  @ApiParam({ name: 'id', description: 'UUID del pago' })
  @ApiOkResponse({ description: 'Pago actualizado', type: SessionPayment })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiResponse({ status: 422, description: 'Transición inválida o pago ya completado' })
  pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionPaymentDto,
  ): Promise<SessionPayment> {
    return this.service.pay(id, dto);
  }
}
