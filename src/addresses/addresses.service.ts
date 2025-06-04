import { Injectable, NotFoundException, Type } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { DeleteAddressDto } from './dto/delete-address.dto';
import { Address, AddressDocument } from './schemas/address.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    private usersService: UsersService,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const user = await this.usersService.findByUserId(createAddressDto.userId);

    if (!user) {
      throw new NotFoundException(`User #${createAddressDto.userId} not found`);
    }

    const addressIds = user.addresses.map((address) => address._id.toString());

    if (createAddressDto.isDefault) {
      await this.addressModel.updateMany(
        { _id: { $in: addressIds }, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const createdAddress = new this.addressModel(createAddressDto);
    const savedAddress = await createdAddress.save();

    const addressId = savedAddress._id as Types.ObjectId;

    await this.usersService.addAddressToUser(
      createAddressDto.userId,
      addressId.toString(),
    );

    return savedAddress;
  }

  async findByAddressId(addressId: string): Promise<Address> {
    const address = await this.addressModel.findById(addressId).exec();
    if (!address) {
      throw new NotFoundException(`Address #${addressId} not found`);
    }
    return address;
  }

  async update(
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {

    if (updateAddressDto.isDefault) {
      const user = await this.usersService.findByUserId(updateAddressDto.userId);
      const addressIds = user.addresses.map((address) => address._id.toString());

      await this.addressModel.updateMany(
        { _id: { $in: addressIds }, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const updatedAddress = await this.addressModel
      .findByIdAndUpdate(addressId, updateAddressDto, { new: true })
      .exec();
    if (!updatedAddress) {
      throw new NotFoundException(`Address #${addressId} not found`);
    }
    return updatedAddress;
  }

  async delete(
    addressId: string,
    deleteAddressDto: DeleteAddressDto,
  ): Promise<string> {
    const user = await this.usersService.removeAddressFromUser(
      deleteAddressDto.userId,
      addressId,
    );

    if (!user) {
      throw new NotFoundException(`User #${deleteAddressDto.userId} not found`);
    } else {
      await this.addressModel.findByIdAndDelete(addressId).exec();
      return 'Address deleted';
    }
  }
}
