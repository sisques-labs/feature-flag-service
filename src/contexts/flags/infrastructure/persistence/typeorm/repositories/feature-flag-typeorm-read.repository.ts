import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseDatabaseRepository,
  Criteria,
  PaginatedResult,
  SortDirection,
} from '@sisques-labs/nestjs-kit';
import { applyCriteriaToQueryBuilder } from '@sisques-labs/nestjs-kit/typeorm';
import { Repository } from 'typeorm';

import { IFeatureFlagReadRepository } from '../../../../domain/repositories/read/feature-flag-read.repository';
import { FeatureFlagViewModel } from '../../../../domain/view-models/feature-flag.view-model';
import { FeatureFlagTypeOrmEntity } from '../entities/feature-flag.entity';
import { FeatureFlagTypeOrmMapper } from '../mappers/feature-flag-typeorm.mapper';

@Injectable()
export class FeatureFlagTypeOrmReadRepository
  extends BaseDatabaseRepository
  implements IFeatureFlagReadRepository
{
  constructor(
    @InjectRepository(FeatureFlagTypeOrmEntity)
    private readonly repository: Repository<FeatureFlagTypeOrmEntity>,
    private readonly mapper: FeatureFlagTypeOrmMapper,
  ) {
    super();
  }

  async findById(id: string): Promise<FeatureFlagViewModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByTenantAndKey(
    tenantId: string,
    key: string,
  ): Promise<FeatureFlagViewModel | null> {
    const entity = await this.repository.findOne({
      where: { tenantId, key },
    });
    return entity ? this.mapper.toViewModel(entity) : null;
  }

  async findByCriteria(
    criteria: Criteria,
  ): Promise<PaginatedResult<FeatureFlagViewModel>> {
    const { page, limit, skip } = await this.calculatePagination(criteria);

    const qb = this.repository.createQueryBuilder('featureFlag');
    applyCriteriaToQueryBuilder(qb, criteria, {
      alias: 'featureFlag',
      defaultSort: { field: 'createdAt', direction: SortDirection.DESC },
    });

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return new PaginatedResult(
      entities.map((entity) => this.mapper.toViewModel(entity)),
      total,
      page,
      limit,
    );
  }

  async save(): Promise<void> {
    // Read-side projection — writes go through FeatureFlagTypeOrmWriteRepository.
  }

  async delete(): Promise<void> {
    // Read-side projection — deletes go through FeatureFlagTypeOrmWriteRepository.
  }
}
