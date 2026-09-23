import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
    const user = request.user || {
      // Default fallback mock user for unauthenticated dev sandbox
      id: 'usr-dev-demo-01',
      email: 'admin@acme.com',
      tenantId: request.headers['x-tenant-id'] || 'acme-corp',
      role: 'ADMIN',
      name: 'Sarah Connor',
    };

    return data ? user[data] : user;
  },
);

export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return (request.headers['x-tenant-id'] as string) || request.user?.tenantId || 'acme-corp';
});
