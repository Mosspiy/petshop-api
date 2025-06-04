import { IsMongoId, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly productId: string;
  
  @IsString()
  @IsNotEmpty()
  readonly size: string;
  
  @IsNumber()
  @IsNotEmpty()
  readonly quantity: number;
  
  @IsNumber()
  @IsNotEmpty()
  readonly price: number; // ราคาต่อชิ้น
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsMongoId()
  readonly userId: string;
  
  @IsString()
  @IsOptional()
  readonly orderCode?: string;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  readonly items: OrderItemDto[];
  
  @IsNumber()
  @IsNotEmpty()
  readonly totalPrice: number;
  
  @IsNumber()
  @IsNotEmpty()
  readonly totalQuantity: number;
  
  @IsNumber()
  @IsOptional()
  readonly subtotal?: number; // ราคารวมสินค้าก่อนหักส่วนลดและค่าส่ง
  
  @IsNumber()
  @IsOptional()
  readonly discount?: number; // ส่วนลด
  
  @IsNumber()
  @IsOptional()
  readonly shipping?: number; // ค่าส่ง
  
  @IsString()
  @IsOptional()
  readonly status?: string;
  
  @IsMongoId()
  @IsNotEmpty()
  readonly addressId: string;
  
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  readonly orderDate?: Date;
  
  @IsBoolean()
  @IsOptional()
  readonly isReviewed?: boolean; // สถานะการรีวิว
}