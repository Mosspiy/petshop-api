import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ versionKey: false })
export class Address {

    @Prop()
    label: string;

    @Prop()
    name: string;

    @Prop()
    lastname: string;

    @Prop()
    phone: string;

    @Prop()
    address: string;

    @Prop()
    zipCode: string;

    @Prop()
    province: string;

    @Prop()
    district: string;

    @Prop()
    isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
