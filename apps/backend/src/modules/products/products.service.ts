import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, Category } from '../../database/entities';
import { ValkeyService } from '../../cache/valkey.service';
import { CreateProductDto, ProductQueryDto, UpdateProductPriceDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly CATALOG_CACHE_TTL = 600; // 10 minutes

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly valkeyService: ValkeyService,
  ) {}

  async listProducts(tenantId: string, query: ProductQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `catalog:products:tenant:${tenantId}:page:${page}:limit:${limit}:search:${query.search || ''}:cat:${query.categoryId || ''}`;

    return this.valkeyService.remember(cacheKey, this.CATALOG_CACHE_TTL, async () => {
      this.logger.debug(`Fetching products from database for tenant: ${tenantId}, page: ${page}`);

      const qb = this.productRepo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.warehouseStock', 'warehouseStock')
        .where('product.active = :active', { active: true });

      if (query.search) {
        qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
          search: `%${query.search}%`,
        });
      }

      if (query.categoryId) {
        qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
      }

      qb.orderBy('product.createdAt', 'DESC').skip(skip).take(limit);

      const [items, total] = await qb.getManyAndCount();

      const itemsWithStock = items.map((product) => {
        const totalStock = (product.warehouseStock || []).reduce(
          (acc, s) => acc + Number(s.quantity),
          0,
        );
        const totalReserved = (product.warehouseStock || []).reduce(
          (acc, s) => acc + Number(s.reservedQuantity),
          0,
        );
        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          costPrice: Number(product.costPrice),
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
      const product = await this.productRepo.findOne({
        where: { id },
        relations: ['category', 'warehouseStock', 'warehouseStock.warehouse'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} was not found`);
      }

      return product;
    });
  }

  async createProduct(_tenantId: string, dto: CreateProductDto) {
    const product = this.productRepo.create({
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      costPrice: dto.costPrice,
      categoryId: dto.categoryId,
    });

    const saved = await this.productRepo.save(product);
    this.logger.log(`Created new catalog product ${saved.sku}`);
    return saved;
  }

  async updateProductPrice(id: string, dto: UpdateProductPriceDto) {
    const existing = await this.productRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Product with ID ${id} was not found`);
    }

    await this.productRepo.update(id, { price: dto.price });
    const updated = await this.productRepo.findOne({ where: { id } });

    // Invalidate product cache
    await this.valkeyService.del(`product:${id}`);

    this.logger.log(`Updated price for product ${id} from ${existing.price} to ${updated!.price}`);
    return updated;
  }
}
