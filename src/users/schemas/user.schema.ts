import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {
    _id?: string | Types.ObjectId;
    @Prop({ required: true })
    lineId: string;

    @Prop()
    displayName?: string;

    @Prop()
    pictureUrl?: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Address' }] })
    addresses: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'Favorite' })
    favorites: Types.ObjectId;
    
    @Prop({ type: Types.ObjectId, ref: 'Cart' })
    cart: Types.ObjectId;
    
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Orders' }] })
    orders: Types.ObjectId[];

}

export const UserSchema = SchemaFactory.createForClass(User);
