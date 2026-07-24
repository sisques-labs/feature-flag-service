import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// The migration (src/database/migrations/*-CreateFeatureFlags.ts) is the
// source of truth for the actual schema. These @Index decorators only matter
// when DATABASE_SYNCHRONIZE=true (local dev convenience) — kept in sync with
// the migration so both paths produce the same indexes.
@Entity('feature_flags')
@Index('UQ_feature_flags_tenant_key', ['tenantId', 'key'], { unique: true })
@Index('IDX_feature_flags_tenant_id', ['tenantId'])
export class FeatureFlagTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 100 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ name: 'development_enabled', type: 'boolean', default: false })
  developmentEnabled!: boolean;

  @Column({ name: 'staging_enabled', type: 'boolean', default: false })
  stagingEnabled!: boolean;

  @Column({ name: 'production_enabled', type: 'boolean', default: false })
  productionEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
