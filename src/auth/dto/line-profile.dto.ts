import { IsString, IsOptional } from 'class-validator';

export class LineProfileDto {
  @IsString()
  userId: string;

  @IsString()
  displayName: string;

  @IsString()
  @IsOptional()
  pictureUrl?: string;
}