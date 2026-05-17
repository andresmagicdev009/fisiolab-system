import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable_action';
export const Auditable = (action: string) => SetMetadata(AUDITABLE_KEY, action);
