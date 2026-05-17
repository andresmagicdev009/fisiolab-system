import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';

/** All fields from CreatePatientDto become optional. userId and cedula cannot be updated. */
export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
