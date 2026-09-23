import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { ProductsService } from './products.service';
import { CreateProductDto, ProductQueryDto, UpdateProductPriceDto } from './dto/products.dto';
import { TenantId } from '../../common/decorators/current-user.decorator';

@Controller('products')
@UsePipes(new ZodValidationPipe())
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(@TenantId() tenantId: string, @Query() query: ProductQueryDto) {
    return this.productsService.listProducts(tenantId, query);
  }

  @Get(':id')
  async getProduct(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(tenantId, dto);
  }

  @Put(':id/price')
  async updatePrice(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProductPriceDto,
  ) {
    return this.productsService.updateProductPrice(id, dto);
  }
}
