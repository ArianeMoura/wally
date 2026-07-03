import { GruposRepositorio } from '../../repositorios/GruposRepositorio'

export class DeleteGrupoUseCase {
  constructor(private gruposRepositorio: GruposRepositorio) {}

  async execute(id: string): Promise<void> {
    console.log({ id })
    await this.gruposRepositorio.delete(id)
  }
}
