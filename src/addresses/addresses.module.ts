import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address, AddressSchema } from './schemas/address.schema';
import { UsersModule } from '../users/users.module'; // ✅ Import UserModule

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Address.name,
        schema: AddressSchema,
      },
    ]),
    UsersModule, // ✅ Import UserModule
  ],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
