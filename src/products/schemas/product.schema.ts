import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
class OptionDto {
  @Prop()
  size: string;

  @Prop()
  price: number;

  @Prop()
  stock: number;
}

const OptionSchema = SchemaFactory.createForClass(OptionDto);

@Schema({ versionKey: false })
export class Product {
  @Prop()
  name: string;

  @Prop()
  about: string;

  @Prop()
  description: string;

  @Prop()
  imageUrl: string;

  @Prop()
  category: string;
  
  @Prop({ default: '' })
  animalType: string;

  @Prop({ type: [OptionSchema], default: [] })
  options: OptionDto[];

  @Prop({ default: 0 })
  totalPurchases: number;

  @Prop({ default: Date.now })
  updateAt: Date;

  @Prop()
  status: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);