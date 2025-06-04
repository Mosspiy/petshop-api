import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { DeleteAddressDto } from './dto/delete-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(createAddressDto);
  }

  @Get(':addressId')
  findOne(@Param('addressId') addressId: string) {
    return this.addressesService.findByAddressId(addressId);
  }

  @Patch(':addressId')
  update(@Param('addressId') addressId: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(addressId, updateAddressDto);
  }

  @Delete(':addressId')
  delete(@Param('addressId') addressId: string,@Body() deleteAddressDto: DeleteAddressDto) {
    return this.addressesService.delete(addressId, deleteAddressDto);
  }
  
}
