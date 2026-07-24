import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { ApiKeyGuard } from './api-key.guard';

const VALID_KEY = 'a'.repeat(32);

function buildConfigService(apiKey: string | undefined = VALID_KEY) {
  return {
    getOrThrow: jest.fn().mockReturnValue(apiKey),
  } as unknown as ConfigService;
}

function buildReflector(isPublic = false) {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  } as unknown as Reflector;
}

function buildHttpContext(headers: Record<string, string | undefined>) {
  return {
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as any;
}

function buildGraphqlContext(headers: Record<string, string | undefined>) {
  return {
    getType: () => 'graphql',
    getHandler: () => () => undefined,
    getClass: () => class {},
    getArgs: () => [{}, {}, { req: { headers } }, {}],
  } as any;
}

describe('ApiKeyGuard', () => {
  it('allows an HTTP request carrying the correct x-api-key header', () => {
    const guard = new ApiKeyGuard(buildConfigService(), buildReflector());

    expect(
      guard.canActivate(buildHttpContext({ 'x-api-key': VALID_KEY })),
    ).toBe(true);
  });

  it('rejects an HTTP request with no x-api-key header', () => {
    const guard = new ApiKeyGuard(buildConfigService(), buildReflector());

    expect(() => guard.canActivate(buildHttpContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an HTTP request with an incorrect x-api-key header', () => {
    const guard = new ApiKeyGuard(buildConfigService(), buildReflector());

    expect(() =>
      guard.canActivate(buildHttpContext({ 'x-api-key': 'wrong-key' })),
    ).toThrow(UnauthorizedException);
  });

  it('allows a GraphQL request carrying the correct x-api-key header', () => {
    const guard = new ApiKeyGuard(buildConfigService(), buildReflector());

    expect(
      guard.canActivate(buildGraphqlContext({ 'x-api-key': VALID_KEY })),
    ).toBe(true);
  });

  it('rejects a GraphQL request with a missing x-api-key header', () => {
    const guard = new ApiKeyGuard(buildConfigService(), buildReflector());

    expect(() => guard.canActivate(buildGraphqlContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows a request with no api key when the route is marked @Public()', () => {
    const guard = new ApiKeyGuard(buildConfigService(), buildReflector(true));

    expect(guard.canActivate(buildHttpContext({}))).toBe(true);
  });
});
