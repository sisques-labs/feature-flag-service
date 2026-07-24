import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType('FeatureFlag')
export class FeatureFlagObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tenantId!: string;

  @Field(() => String)
  key!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Boolean)
  developmentEnabled!: boolean;

  @Field(() => Boolean)
  stagingEnabled!: boolean;

  @Field(() => Boolean)
  productionEnabled!: boolean;

  @Field(() => Boolean)
  archived!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
