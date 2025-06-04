import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteDocument = Favorite & Document;

@Schema({ _id: false })
class FavoriteItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;
}

const FavoriteItemSchema = SchemaFactory.createForClass(FavoriteItem);

@Schema({ versionKey: false })
export class Favorite {
  // เพิ่ม userId เข้าไปใน schema
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [FavoriteItemSchema], default: [] })
  items: FavoriteItem[];
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);