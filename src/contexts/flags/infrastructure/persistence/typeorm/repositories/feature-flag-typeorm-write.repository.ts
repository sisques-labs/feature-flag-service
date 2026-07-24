import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { FeatureFlagAggregate } from '../../../../domain/aggregates/feature-flag.aggregate';
import { FeatureFlagKeyAlreadyExistsException } from '../../../../domain/exceptions/feature-flag-key-already-exists.exception';
import { IFeatureFlagWriteRepository } from '../../../../domain/repositories/write/feature-flag-write.repository';
import { FeatureFlagTypeOrmEntity } from '../entities/feature-flag.entity';
import { FeatureFlagTypeOrmMapper } from '../mappers/feature-flag-typeorm.mapper';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class FeatureFlagTypeOrmWriteRepository implements IFeatureFlagWriteRepository {
  constructor(
    @InjectRepository(FeatureFlagTypeOrmEntity)
    private readonly repository: Repository<FeatureFlagTypeOrmEntity>,
    private readonly mapper: FeatureFlagTypeOrmMapper,
  ) {}

  async findById(id: string): Promise<FeatureFlagAggregate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async findByTenantAndKey(
    tenantId: string,
    key: string,
  ): Promise<FeatureFlagAggregate | null> {
    const entity = await this.repository.findOne({
      where: { tenantId, key },
    });
    return entity ? this.mapper.toAggregate(entity) : null;
  }

  async save(aggregate: FeatureFlagAggregate): Promise<FeatureFlagAggregate> {
    const entity = this.mapper.toEntity(aggregate);

    try {
      const saved = await this.repository.save(entity);
      return this.mapper.toAggregate(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new FeatureFlagKeyAlreadyExistsException(
          aggregate.tenantId,
          aggregate.key,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  findByCriteria(
    _criteria: Criteria,
  ): Promise<PaginatedResult<FeatureFlagAggregate>> {
    throw new Error('Method not implemented.');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
