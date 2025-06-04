import { IsMongoId, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly productId: string;

    @IsString()
    @IsNotEmpty()
    readonly size: string;
  
    @IsNumber()
    @IsNotEmpty()
    readonly quantity: number;
}

export class UpdateCartDto {
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    readonly items: CartItemDto[];
}
