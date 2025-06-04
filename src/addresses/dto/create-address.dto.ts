import { IsString, IsNotEmpty, IsMongoId, IsBoolean, Length } from 'class-validator';

export class CreateAddressDto {
    @IsMongoId()
    @IsNotEmpty()
    readonly userId: string; // สร้างไว้ใช้เช็คว่าจะเพิ่ม address ให้กับ user ไหน

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
