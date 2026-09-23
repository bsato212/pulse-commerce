import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductQueryDto, UpdateProductPriceDto } from './dto/products.dto';
import { TenantId } from '../../common/decorators/current-user.decorator';

@Controller('products')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(@TenantId() tenantId: string, @Query() query: ProductQueryDto) {
    return this.productsService.listProducts(tenantId, query);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(tenantId, dto);
  }

  @Put(':id/price')
  async updatePrice(@Param('id') id: string, @Body() dto: UpdateProductPriceDto) {
    return this.productsService.updateProductPrice(id, dto);
  }
}
