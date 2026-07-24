import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeatureFlags1784883103015 implements MigrationInterface {
  name = 'CreateFeatureFlags1784883103015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feature_flags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" character varying(100) NOT NULL,
        "key" character varying(100) NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" character varying(500),
        "development_enabled" boolean NOT NULL DEFAULT false,
        "staging_enabled" boolean NOT NULL DEFAULT false,
        "production_enabled" boolean NOT NULL DEFAULT false,
        "archived" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_feature_flags_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_feature_flags_tenant_key" ON "feature_flags" ("tenant_id", "key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_feature_flags_tenant_id" ON "feature_flags" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "feature_flags"`);
  }
}
