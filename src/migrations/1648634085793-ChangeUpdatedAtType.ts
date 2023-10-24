import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUpdatedAtType1648634085793 implements MigrationInterface {
  name = 'ChangeUpdatedAtType1648634085793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" ALTER COLUMN "updatedAt" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" ALTER COLUMN "updatedAt" DROP DEFAULT`,
    );
  }
}
