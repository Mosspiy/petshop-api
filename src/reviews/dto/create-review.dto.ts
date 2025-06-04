import { IsMongoId, IsNotEmpty, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  @IsOptional() // จะถูกเพิ่มโดยอัตโนมัติจาก token ในตัว controller
  userId?: string;
  
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;
  
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating: number;
  
  @IsString()
  @IsOptional()
  comment?: string;
}