import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseFilters,
  Query,
  NotFoundException,
  InternalServerErrorException,
  Req,
  Logger
} from '@nestjs/common';
import { Request } from 'express';
import { Product } from './schemas/product.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AllExceptionsFilter } from './filters/product.exception_filter';

// Controller สำหรับแอดมิน
@Controller('/admin/products')
@UseFilters(AllExceptionsFilter)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imageUrl'))
  create(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    
    // แปลง options จาก JSON string เป็น array
    let options;
    try {
      options = typeof body.options === 'string' 
        ? JSON.parse(body.options) 
        : body.options;
    } catch (error) {
      throw new BadRequestException('Invalid options format');
    }

    // สร้าง DTO ด้วยตนเอง
    const createProductDto: CreateProductDto = {
      name: body.name,
      description: body.description,
      about: body.about,
      category: body.category,
      animalType: body.animalType, // เพิ่มชนิดของสัตว์
      status: body.status === 'true', // แปลงเป็น boolean
      options: options, // ใช้ options ที่แปลงแล้ว
      updateAt: new Date(body.updateAt),
      imageUrl: file?.filename
    };

    // ตรวจสอบว่า file มีค่าและมี filename
    return this.productsService.create(createProductDto, file?.filename);
  }

  @Get(':productId')
  findOne(@Param('productId') productId: string) {
    return this.productsService.findOne(productId);
  }

  @Patch(':productId')
  @UseInterceptors(FileInterceptor('imageUrl'))
  update(
    @Param('productId') productId: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    // แปลง options จาก JSON string เป็น array
    let options;
    try {
      options = typeof body.options === 'string' 
        ? JSON.parse(body.options) 
        : body.options;
    } catch (error) {
      throw new BadRequestException('Invalid options format');
    }
  
    // สร้าง DTO สำหรับอัปเดต
    const updateProductDto: UpdateProductDto = {
      name: body.name,
      description: body.description,
      about: body.about,
      category: body.category,
      animalType: body.animalType, // เพิ่มชนิดของสัตว์
      status: body.status === 'true', // แปลงเป็น boolean
      options: options,
      updateAt: new Date(),
      imageUrl: file?.filename
    };
  
    return this.productsService.update(productId, updateProductDto, file?.filename);
  }

  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    
    return products.map(product => ({
      ...product,
      imageUrl: product.imageUrl 
        ? encodeURIComponent(product.imageUrl)
        : null
    }));
  }

  @Delete(':productId')
  remove(@Param('productId') productId: string) {
    return this.productsService.remove(productId);
  }
  
  @Get('by-animal/:animalType')
  findByAnimalType(@Param('animalType') animalType: string) {
    return this.productsService.findByAnimalType(animalType);
  }
}

// Controller สำหรับลูกค้า (เพิ่มใหม่)
@Controller('products')
export class CustomerProductsController {
  private readonly logger = new Logger(CustomerProductsController.name);
  constructor(private readonly productsService: ProductsService) {
    this.logger.log('CustomerProductsController initialized');}
  
  // ดึงสินค้าทั้งหมดที่มีสถานะ Active
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('animalType') animalType?: string
  ) {
    const allProducts = await this.productsService.findAll();
    
    // กรองเฉพาะสินค้าที่มีสถานะเป็น true (Active)
    let activeProducts = allProducts.filter(product => product.status === true);
    
    // กรองตามหมวดหมู่ (ถ้ามี)
    if (category && category !== 'all') {
      activeProducts = activeProducts.filter(product => product.category === category);
    }
    
    // กรองตามชนิดของสัตว์ (ถ้ามี)
    if (animalType && animalType !== 'all') {
      activeProducts = activeProducts.filter(product => product.animalType === animalType);
    }
    
    return activeProducts.map(product => ({
      ...product,
      imageUrl: product.imageUrl 
        ? encodeURIComponent(product.imageUrl)
        : null
    }));
  }

  // ดึงข้อมูลสินค้าตาม ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const product = await this.productsService.findOne(id);
      
      // ตรวจสอบว่าสินค้ามีสถานะเป็น Active
      if (!product.status) {
        throw new NotFoundException('Product not available');
      }
      
      return {
        ...product,
        imageUrl: product.imageUrl ? encodeURIComponent(product.imageUrl) : null
      };
    } catch (error) {
      throw new NotFoundException('Product not found');
    }
  }

  // ดึงรายการหมวดหมู่ทั้งหมดที่มีสินค้า Active
  @Get('categories/list')
  async getCategories() {
    const allProducts = await this.productsService.findAll();
    
    // กรองเฉพาะสินค้าที่มีสถานะเป็น true (Active)
    const activeProducts = allProducts.filter(product => product.status === true);
    
    // ดึงหมวดหมู่ที่ไม่ซ้ำกัน
    const categories = [...new Set(activeProducts.map(product => product.category))];
    
    return categories.filter(category => category && category.trim() !== '');
  }

  // ดึงรายการชนิดของสัตว์ทั้งหมดที่มีสินค้า Active
  @Get('animal-types/list')
  async getAnimalTypes() {
    const allProducts = await this.productsService.findAll();
    
    // กรองเฉพาะสินค้าที่มีสถานะเป็น true (Active)
    const activeProducts = allProducts.filter(product => product.status === true);
    
    // ดึงชนิดของสัตว์ที่ไม่ซ้ำกัน
    const animalTypes = [...new Set(activeProducts.map(product => product.animalType))];
    
    return animalTypes.filter(type => type && type.trim() !== '');
  }
  // ดึงสินค้าตามชนิดของสัตว์
  @Get('animal-type/:animalType')
  async findByAnimalType(@Param('animalType') animalType: string) {
    const allProducts = await this.productsService.findByAnimalType(animalType);
    
    // กรองเฉพาะสินค้าที่มีสถานะเป็น true (Active)
    const activeProducts = allProducts.filter(product => product.status === true);
    
    return activeProducts.map(product => ({
      ...product,
      imageUrl: product.imageUrl 
        ? encodeURIComponent(product.imageUrl)
        : null
    }));
  }

  @Get('search')
  async searchProducts(
    @Req() req: Request,
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('animalType') animalType?: string,
    @Query('price') priceLevel?: string
  ) {
    console.log('Full Request Details:', {
      url: req.url,
      method: req.method,
      fullQuery: req.query
    });
  
    try {
      // Explicitly decode parameters
      const decodedQuery = query ? decodeURIComponent(query) : '';
      const decodedCategory = category ? decodeURIComponent(category) : 'ทั้งหมด';
      const decodedAnimalType = animalType ? decodeURIComponent(animalType) : 'ทั้งหมด';
  
      console.log('Decoded Parameters:', { 
        decodedQuery, 
        decodedCategory, 
        decodedAnimalType, 
        priceLevel 
      });
  
      // Get all products
      const allProducts = await this.productsService.findAll();
      
      // Filter active products
      let filteredProducts = allProducts.filter(product => product.status === true);
      
      // Search logic
      if (decodedQuery && decodedQuery.trim() !== '') {
        const lowercaseQuery = decodedQuery.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery)
        );
      }
      
      // Category filter
      if (decodedCategory !== 'ทั้งหมด') {
        filteredProducts = filteredProducts.filter(product => 
          product.category.toLowerCase() === decodedCategory.toLowerCase()
        );
      }
      
      // Animal Type filter
      if (decodedAnimalType !== 'ทั้งหมด') {
        filteredProducts = filteredProducts.filter(product => 
          product.animalType.toLowerCase() === decodedAnimalType.toLowerCase()
        );
      }
      
      // Price filter
      if (priceLevel) {
        filteredProducts = filteredProducts.filter(product => {
          const minPrice = Math.min(...product.options.map(option => option.price));
          switch(priceLevel) {
            case '฿': return minPrice < 100;
            case '฿฿': return minPrice >= 100 && minPrice < 500;
            case '฿฿฿': return minPrice >= 500 && minPrice < 1000;
            case '฿฿฿฿': return minPrice >= 1000;
            default: return true;
          }
        });
      }
      
      console.log(`Found ${filteredProducts.length} products`);
      
      // Return products with encoded image URLs
      return filteredProducts.map(product => ({
        ...product,
        imageUrl: product.imageUrl 
          ? encodeURIComponent(product.imageUrl)
          : null
      }));
    } catch (error) {
      console.error('Error in search:', error);
      throw new InternalServerErrorException('เกิดข้อผิดพลาดในการค้นหา');
    }
  }




  // แก้ไข method findByCategory
  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    const allProducts = await this.productsService.findAll();
    
    // ถอด URL encode category
    const decodedCategory = decodeURIComponent(category);
    
    // กรองเฉพาะสินค้าที่มีสถานะเป็น true (Active) และอยู่ในหมวดหมู่ที่ระบุ
    const filteredProducts = allProducts.filter(
      product => product.status === true && product.category === decodedCategory
    );
    
    return filteredProducts.map(product => ({
      ...product,
      imageUrl: product.imageUrl 
        ? encodeURIComponent(product.imageUrl)
        : null
    }));
  }
}