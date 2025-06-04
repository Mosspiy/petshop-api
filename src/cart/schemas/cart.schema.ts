import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ _id: false })
class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop()
  size: string

  @Prop()
  quantity: number;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ versionKey: false })
export class Cart {

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

}

export const CartSchema = SchemaFactory.createForClass(Cart);