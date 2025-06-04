import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto, imageUrl: string): Promise<string> {
    // ตรวจสอบและแปลง options
    const processedOptions = createProductDto.options.map(option => ({
      size: String(option.size),
      price: Number(option.price),
      stock: Number(option.stock)
    }));
  
    const productData = {
      ...createProductDto,
      options: processedOptions,
      imageUrl: imageUrl
    };
  
    const result = new this.productModel(productData);
    await result.save();
    
    return 'Product created successfully';
  }

  async update(productId: string, updateProductDto: UpdateProductDto, imageUrl?: string): Promise<string> {
    
    const product = await this.productModel.findById(productId).exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    if (imageUrl) {
      const filePath = `./uploads/${product.imageUrl}`;
      fs.unlink(filePath, () => {});
      updateProductDto.imageUrl = imageUrl;
    }

    updateProductDto.updateAt = new Date();

    await this.productModel.findByIdAndUpdate(productId, updateProductDto);

    return `This action updates a #${product._id} product `;
  }

  async findAll(): Promise<Product[]> {
    // ดึงสินค้าพร้อมรายละเอียดรูปภาพ
    return this.productModel
      .find()
      .select('+imageUrl') // เลือกฟิลด์ imageUrl
      .lean(); // แปลงเป็น plain object
  }

  async findByIds(productIds: string[]): Promise<Product[]> {
    return this.productModel.find({ _id: { $in: productIds } }).lean();
  }

  async findOne(productId: string): Promise<Product> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
  
  async findByAnimalType(animalType: string): Promise<Product[]> {
    return this.productModel
      .find({ animalType: animalType })
      .select('+imageUrl')
      .lean();
  }

  async pushPurchases(productId: string, quantity: number): Promise<void> {
    await this.productModel.findByIdAndUpdate(
      productId,
      { 
        $inc: { purchases: quantity } 
      }
    );
  }

  async reduceStock(productId: string, size: string, quantity: number): Promise<void> {
    const product = await this.findOne(productId);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    const option = product.options.find(opt => opt.size === size);
    
    if (!option) {
      throw new NotFoundException(`Option ${size} not found for product ${productId}`);
    }
    
    if (option.stock < quantity) {
      throw new Error(`Not enough stock for product ${productId} (${size}). Available: ${option.stock}, Required: ${quantity}`);
    }
    
    // ลดจำนวนสต็อก
    option.stock -= quantity;
    
    // บันทึกข้อมูล
    await this.productModel.findByIdAndUpdate(
      productId,
      { 
        options: product.options 
      }
    );
  }
  async restoreStock(productId: string, size: string, quantity: number): Promise<void> {
    const product = await this.findOne(productId);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    const option = product.options.find(opt => opt.size === size);
    
    if (!option) {
      throw new NotFoundException(`Option ${size} not found for product ${productId}`);
    }
    
    // เพิ่มจำนวนสต็อก
    option.stock += quantity;
    
    // บันทึกข้อมูล
    await this.productModel.findByIdAndUpdate(
      productId,
      { 
        options: product.options 
      }
    );
  }


  async remove(productId: string): Promise<string> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const filePath = `./uploads/${product.imageUrl}`;
    
    fs.unlink(filePath, () => {});
    await this.productModel.findByIdAndDelete(productId);

    return 'Product deleted successfully';
  }
  
  async findByName(searchTerm: string): Promise<Product[]> {
    // ใช้ regular expression สำหรับค้นหาแบบ case-insensitive
    const regex = new RegExp(searchTerm, 'i');
    
    try {
      // ค้นหาสินค้าที่มีชื่อตรงกับ regex
      const products = await this.productModel
        .find({ 
          name: regex, 
          status: true // เฉพาะสินค้าที่ active
        })
        .lean();
      
      return products;
    } catch (error) {
      throw new NotFoundException(`ไม่พบสินค้าที่มีชื่อ: ${searchTerm}`);
    }
  }
  async searchProducts(options: {
    query?: string,
    category?: string,
    animalType?: string,
    price?: string
  }): Promise<Product[]> {
    const allProducts = await this.findAll();
    
    let filteredProducts = allProducts.filter(product => product.status === true);
    
    // Logic filtering คงเดิม
    
    return filteredProducts;
  }
}