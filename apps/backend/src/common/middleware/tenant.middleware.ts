import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const DEFAULT_DEV_TENANT_ID = 'a0000000-0000-4000-8000-000000000001';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private static readonly tenantCache = new Map<string, string>();

  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const rawHeader =
      (req.headers['x-tenant-id'] as string) || (req.headers['x-tenant-slug'] as string);
    const identifier = (rawHeader || 'acme-corp').trim();

    // Check fast cache first
    const cachedUuid = TenantMiddleware.tenantCache.get(identifier);
    if (cachedUuid) {
      req['tenantId'] = cachedUuid;
      req.headers['x-tenant-id'] = cachedUuid;
      return next();
    }

    try {
      if (this.dataSource?.isInitialized) {
        const tenantRepo = this.dataSource.getRepository(Tenant);
        const isUuid = UUID_REGEX.test(identifier);

        let tenant: Tenant | null = null;
        if (isUuid) {
          tenant = await tenantRepo.findOne({ where: { id: identifier } });
        }
        if (!tenant) {
          tenant = await tenantRepo.findOne({ where: { slug: identifier } });
        }

        // If not found by slug/id and requesting default acme-corp, pick first tenant if one exists
        if (!tenant && identifier === 'acme-corp') {
          tenant = await tenantRepo.findOne({ order: { createdAt: 'ASC' } });
        }

        if (tenant) {
          TenantMiddleware.tenantCache.set(identifier, tenant.id);
          TenantMiddleware.tenantCache.set(tenant.slug, tenant.id);
          TenantMiddleware.tenantCache.set(tenant.id, tenant.id);

          req['tenant'] = tenant;
          req['tenantId'] = tenant.id;
          req.headers['x-tenant-id'] = tenant.id;
          return next();
        }
      }
    } catch (err: any) {
      this.logger.debug(`Tenant lookup failed: ${err.message}`);
    }

    // Fallback: if already a UUID, use it. Otherwise use the default dev tenant UUID.
    if (UUID_REGEX.test(identifier)) {
      req['tenantId'] = identifier;
    } else {
      req['tenantId'] = DEFAULT_DEV_TENANT_ID;
      req.headers['x-tenant-id'] = DEFAULT_DEV_TENANT_ID;
    }

    next();
  }
}
