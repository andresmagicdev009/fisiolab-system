export interface IAntecedentesStrategy<TEntity, TDto> {
  findByPatient(patientId: string): Promise<TEntity | null>;
  update(patientId: string, dto: TDto, registradoPorId?: string): Promise<TEntity>;
  findOrCreate(patientId: string): Promise<TEntity>;
}
