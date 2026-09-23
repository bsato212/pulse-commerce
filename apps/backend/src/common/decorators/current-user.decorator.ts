import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DEFAULT_DEV_TENANT_ID } from '../middleware/tenant.middleware';

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const resolvedTenantId =
      request.tenantId || (request.headers['x-tenant-id'] as string) || DEFAULT_DEV_TENANT_ID;

    const user = request.user || {
      // Default fallback mock user for unauthenticated dev sandbox
      id: '00000000-0000-4000-8000-000000000001',
      email: 'admin@acme.com',
      tenantId: resolvedTenantId,
      role: 'ADMIN',
      name: 'Sarah Connor',
    };

    if (request.user && !request.user.tenantId) {
      request.user.tenantId = resolvedTenantId;
    }

    return data ? user[data] : user;
  },
);

export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return (
    request.tenantId ||
    (request.headers['x-tenant-id'] as string) ||
    request.user?.tenantId ||
    DEFAULT_DEV_TENANT_ID
  );
});
