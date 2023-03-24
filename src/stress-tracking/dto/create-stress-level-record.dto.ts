import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateStressLevelRecordDto {
  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @IsInt()
  @Min(0)
  @Max(5)
  readonly stressLevel: number;

  readonly image?: string;

  readonly timestamp?: Date;
}
