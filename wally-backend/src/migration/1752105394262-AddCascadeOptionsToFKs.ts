import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCascadeOptionsToFKs1752105394262 implements MigrationInterface {
  name = 'AddCascadeOptionsToFKs1752105394262'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transacoes" DROP CONSTRAINT "FK_8cb6a1f4e77824057f799940ec7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" DROP CONSTRAINT "FK_c1b70e0eb18d9c162b8726238c0"`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" DROP CONSTRAINT "FK_1360f1186680b32d861856b2a52"`,
    )
    await queryRunner.query(
      `ALTER TABLE "despesas_grupo" DROP CONSTRAINT "FK_5664ea39df336794d1147a503a1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "pagamentos_despesas" DROP CONSTRAINT "FK_14f17ef621124a3bb93fe5b8c64"`,
    )
    await queryRunner.query(
      `ALTER TABLE "transacoes" ADD CONSTRAINT "FK_8cb6a1f4e77824057f799940ec7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" ADD CONSTRAINT "FK_c1b70e0eb18d9c162b8726238c0" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" ADD CONSTRAINT "FK_1360f1186680b32d861856b2a52" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "despesas_grupo" ADD CONSTRAINT "FK_5664ea39df336794d1147a503a1" FOREIGN KEY ("grupo_membros_id") REFERENCES "grupos_membros"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "pagamentos_despesas" ADD CONSTRAINT "FK_14f17ef621124a3bb93fe5b8c64" FOREIGN KEY ("despesa_id") REFERENCES "despesas_grupo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pagamentos_despesas" DROP CONSTRAINT "FK_14f17ef621124a3bb93fe5b8c64"`,
    )
    await queryRunner.query(
      `ALTER TABLE "despesas_grupo" DROP CONSTRAINT "FK_5664ea39df336794d1147a503a1"`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" DROP CONSTRAINT "FK_1360f1186680b32d861856b2a52"`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" DROP CONSTRAINT "FK_c1b70e0eb18d9c162b8726238c0"`,
    )
    await queryRunner.query(
      `ALTER TABLE "transacoes" DROP CONSTRAINT "FK_8cb6a1f4e77824057f799940ec7"`,
    )
    await queryRunner.query(
      `ALTER TABLE "pagamentos_despesas" ADD CONSTRAINT "FK_14f17ef621124a3bb93fe5b8c64" FOREIGN KEY ("despesa_id") REFERENCES "despesas_grupo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "despesas_grupo" ADD CONSTRAINT "FK_5664ea39df336794d1147a503a1" FOREIGN KEY ("grupo_membros_id") REFERENCES "grupos_membros"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" ADD CONSTRAINT "FK_1360f1186680b32d861856b2a52" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "grupos_membros" ADD CONSTRAINT "FK_c1b70e0eb18d9c162b8726238c0" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "transacoes" ADD CONSTRAINT "FK_8cb6a1f4e77824057f799940ec7" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
