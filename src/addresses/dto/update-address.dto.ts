import { IsString, IsNotEmpty, IsBoolean, Length, IsMongoId } from 'class-validator';

export class UpdateAddressDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly userId: string;

    @IsString()
    @IsNotEmpty()
    readonly label: string;

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    readonly lastname: string;

    @IsString()
    @IsNotEmpty()
    @Length(10, 10)
    readonly phone: string;

    @IsString()
    @IsNotEmpty()
    readonly address: string;

    @IsString()
    @IsNotEmpty()
    readonly zipCode: string;

    @IsString()
    @IsNotEmpty()
    readonly province: string;

    @IsString()
    @IsNotEmpty()
    readonly district: string;

    @IsBoolean()
    @IsNotEmpty()
    readonly isDefault: boolean;
}
