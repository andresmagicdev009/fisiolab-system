import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ExerciseOrderItemDto {
  @ApiProperty({ example: 'e1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt() @Min(1)
  orden!: number;
}

export class ReorderExercisesDto {
  @ApiProperty({ type: () => [ExerciseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseOrderItemDto)
  orden!: ExerciseOrderItemDto[];
}
