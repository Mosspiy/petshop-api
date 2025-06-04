import { IsString, IsNumber, IsBoolean, IsNotEmpty, IsOptional, IsArray, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
    @IsString()
    @IsNotEmpty()
    readonly size: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    readonly price: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    readonly stock: number;
}

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    
    @IsString()
    @IsNotEmpty()
    readonly about: string;
    
    @IsString()
    @IsNotEmpty()
    readonly description: string;
    
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsNotEmpty()
    readonly category: string;
    
    @IsString()
    @IsOptional()
    readonly animalType?: string;

    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => OptionDto)
    options: OptionDto[];

    @IsNumber()
    @IsOptional()
    readonly totalPurchases?: number;
    
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    readonly updateAt: Date;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    readonly status: boolean;
}