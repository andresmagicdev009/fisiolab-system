import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Invoice } from './entities/invoice.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const BILLERS = [UserRole.ADMIN, UserRole.MEDICO];

@ApiTags('Invoices')
@ApiBearerAuth('JWT')
@Controller('payments/:paymentId/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  @Roles(...BILLERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_INVOICE')
  @ApiOperation({ summary: 'Emitir factura para un pago (solo ADMIN/MEDICO, pago debe estar PAGADO)' })
  @ApiParam({ name: 'paymentId', description: 'UUID del pago' })
  @ApiCreatedResponse({ description: 'Factura creada', type: Invoice })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiConflictResponse({ description: 'Número de factura duplicado' })
  @ApiResponse({ status: 422, description: 'Pago no está en estado PAGADO' })
  create(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: CreateInvoiceDto,
  ): Promise<Invoice> {
    return this.service.create(paymentId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_INVOICES')
  @ApiOperation({ summary: 'Listar facturas de un pago' })
  @ApiParam({ name: 'paymentId', description: 'UUID del pago' })
  @ApiOkResponse({ description: 'Lista paginada de facturas' })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  findByPayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Query() query: InvoiceQueryDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    return this.service.findByPayment(paymentId, query);
  }

  @Get(':invoiceId')
  @Roles(...READERS)
  @Auditable('READ_INVOICE')
  @ApiOperation({ summary: 'Obtener factura por ID' })
  @ApiParam({ name: 'paymentId', description: 'UUID del pago' })
  @ApiParam({ name: 'invoiceId', description: 'UUID de la factura' })
  @ApiOkResponse({ description: 'Factura encontrada', type: Invoice })
  @ApiNotFoundResponse({ description: 'Factura no encontrada' })
  findOne(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<Invoice> {
    return this.service.findOne(paymentId, invoiceId);
  }
}
