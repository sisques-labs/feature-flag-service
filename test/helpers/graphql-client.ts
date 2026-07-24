import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { TEST_API_KEY } from './api-key';

/**
 * Sends a GraphQL request to the running app, authenticated with the shared
 * test API key (every GraphQL request goes through the global ApiKeyGuard).
 *
 * @param app    - The bootstrapped NestJS application
 * @param query  - GraphQL operation string (query or mutation)
 * @param variables - Optional variables map
 */
export function gql(
  app: INestApplication,
  query: string,
  variables?: Record<string, unknown>,
): request.Test {
  return request(app.getHttpServer())
    .post('/graphql')
    .set('X-Api-Key', TEST_API_KEY)
    .send({ query, variables: variables ?? {} });
}
