import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ValkeyService } from '../../cache/valkey.service';
import { CreateProductDto, ProductQueryDto, UpdateProductPriceDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly CATALOG_CACHE_TTL = 600; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly valkeyService: ValkeyService,
  ) {}

  async listProducts(tenantId: string, query: ProductQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `catalog:products:tenant:${tenantId}:page:${page}:limit:${limit}:search:${query.search || ''}:cat:${query.categoryId || ''}`;
    
    return this.valkeyService.remember(cacheKey, this.CATALOG_CACHE_TTL, async () => {
      this.logger.debug(`Fetching products from database for tenant: ${tenantId}, page: ${page}`);
      
      const where: any = {
        tenantId,
        active: true,
      };

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.categoryId) {
        where.categoryId = query.categoryId;
      }

      const [items, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: true,
            warehouseStock: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where }),
      ]);

      const itemsWithStock = items.map((product) => {
        const totalStock = product.warehouseStock.reduce((acc, s) => acc + s.quantity, 0);
        const totalReserved = product.warehouseStock.reduce((acc, s) => acc + s.reservedQuantity, 0);
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: product.price,
          costPrice: product.costPrice,
          categoryId: product.categoryId,
          categoryName: product.category?.name,
          active: product.active,
          totalAvailableStock: totalStock - totalReserved,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        };
      });

      return {
        data: itemsWithStock,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    });
  }

  async getProductById(id: string) {
    const cacheKey = `catalog:product:${id}`;
    
    return this.valkeyService.remember(cacheKey, this.CATALOG_CACHE_TTL, async () => {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          warehouseStock: {
            include: { warehouse: true },
          },
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} was not found`);
      }

      return product;
    });
  }

  async createProduct(tenantId: string, dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: {
        tenantId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        costPrice: dto.costPrice,
        categoryId: dto.categoryId,
      },
    });

    this.logger.log(`Created new catalog product ${product.sku} for tenant ${tenantId}`);
    return product;
  }

  async updateProductPrice(id: string, dto: UpdateProductPriceDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} was not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { price: dto.price },
    });

    // Invalidate product cache
    await this.valkeyService.del(`product:${id}`);

    this.logger.log(`Updated price for product ${id} from ${existing.price} to ${updated.price}`);
    return updated;
  }
}
