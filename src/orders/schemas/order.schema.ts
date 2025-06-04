import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop()
  size: string;

  @Prop()
  quantity: number;

  @Prop()
  price: number; // ราคาต่อชิ้น
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ versionKey: false, timestamps: true })
export class Order {
  @Prop({ type: String, required: true, unique: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ required: true })
  totalQuantity: number;
  
  @Prop({ default: 0 })
  subtotal: number; // ราคารวมสินค้าก่อนหักส่วนลดและค่าส่ง
  
  @Prop({ default: 0 })
  discount: number; // ส่วนลด
  
  @Prop({ default: 0 })
  shipping: number; // ค่าส่ง

  @Prop({ required: true })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Address', required: true })
  addressId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  orderDate: Date;
  
  @Prop({ type: String, default: null })
  trackingNumber: string; // เลข Tracking สำหรับติดตามพัสดุ
  
  @Prop({ type: Boolean, default: false })
  isReviewed: boolean; // สถานะการรีวิว (true หากมีการรีวิวแล้ว)
}

export const OrderSchema = SchemaFactory.createForClass(Order);