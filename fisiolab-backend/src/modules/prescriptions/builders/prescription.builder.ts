import { CreateMedicationDto } from '../dto/create-medication.dto';

export class PrescriptionBuilder {
  private readonly medications: CreateMedicationDto[] = [];

  withMedication(med: CreateMedicationDto): this {
    this.medications.push(med);
    return this;
  }

  withMedications(meds: CreateMedicationDto[]): this {
    this.medications.push(...meds);
    return this;
  }

  buildMedications(): CreateMedicationDto[] {
    return this.medications.map((med, index) => ({
      ...med,
      orden: med.orden ?? index + 1,
    }));
  }
}
