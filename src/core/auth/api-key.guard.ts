import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { IS_PUBLIC_KEY } from './public.decorator';

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Global guard protecting every transport (REST, GraphQL, MCP — MCP tool
 * calls go through the same HTTP execution context as REST) with a single
 * static API key, read from `FEATURE_FLAGS_API_KEY`.
 *
 * This is a stopgap until `identity-service` exists: there is no per-tenant
 * or per-key auth yet, just one shared secret gating the whole service.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = this.extractRequest(context);
    const provided = request.headers['x-api-key'];
    const expected = this.configService.getOrThrow<string>('auth.apiKey');

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }

  private extractRequest(context: ExecutionContext): RequestWithHeaders {
    if (context.getType<'graphql'>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req: RequestWithHeaders;
      }>().req;
    }

    return context.switchToHttp().getRequest<RequestWithHeaders>();
  }
}
