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

export class UpdateProductDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
    
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
    readonly options: OptionDto[];
    
    @IsDate()
    @IsOptional()
    updateAt?: Date;

    @IsBoolean()
    @IsNotEmpty()
    @Type(() => Boolean)
    readonly status: boolean;
}