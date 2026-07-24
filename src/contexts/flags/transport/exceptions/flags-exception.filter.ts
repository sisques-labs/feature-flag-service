import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { FeatureFlagKeyAlreadyExistsException } from '../../domain/exceptions/feature-flag-key-already-exists.exception';
import { FeatureFlagNotFoundException } from '../../domain/exceptions/feature-flag-not-found.exception';

/**
 * Resolves the HTTP status for exceptions raised by the `flags` context.
 * Registered in `src/core/filters/base-exception.filter.ts`'s
 * `EXCEPTION_STATUS_RESOLVERS`.
 */
export function resolveFlagsExceptionStatus(
  exception: BaseException,
): number | undefined {
  if (exception instanceof FeatureFlagNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof FeatureFlagKeyAlreadyExistsException) {
    return HttpStatus.CONFLICT;
  }
  return undefined;
}
