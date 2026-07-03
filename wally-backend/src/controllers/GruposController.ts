import { FastifyRequest, FastifyReply } from 'fastify'
import { GruposRepositorio } from '../repositorios/GruposRepositorio'
import { GrupoMembrosRepositorio } from '../repositorios/GrupoMembrosRepositorio'
import { CreateGrupoUseCase } from '../use-cases/grupos/CreateGrupoUseCase'
import { GetGruposByUsuarioIdUseCase } from '../use-cases/grupos/GetGruposByUsuarioIdUseCase'
import { DeleteGrupoUseCase } from 'use-cases/grupos/DeleteGrupoUseCase'

const gruposRepositorio = new GruposRepositorio()
const grupoMembrosRepositorio = new GrupoMembrosRepositorio()

export class GruposController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const usuario_id = request.usuario_id.id

      const { nome, descricao, avatar_url, membros } = request.body as {
        nome: string
        descricao: string
        avatar_url: string
        membros: string[]
      }

      console.log({
        nome,
        descricao,
        avatar_url,
        membros,
        usuario_id,
      })

      const criarGrupoUseCase = new CreateGrupoUseCase(
        gruposRepositorio,
        grupoMembrosRepositorio,
      )

      const grupo = await criarGrupoUseCase.execute({
        nome,
        descricao,
        avatar_url,
        membros,
        usuario_id,
      })

      return reply.status(200).send(grupo)
    } catch (error) {
      return reply
        .status(500)
        .send({ message: 'Erro ao criar grupo', error: error.message })
    }
  }

  async findAllByUsuarioId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { usuario_id } = request.query as { usuario_id: string }

      const getGruposByUsuarioIdUseCase = new GetGruposByUsuarioIdUseCase(
        grupoMembrosRepositorio,
      )

      const grupos = await getGruposByUsuarioIdUseCase.execute(usuario_id)

      return reply.status(200).send(grupos)
    } catch (error) {
      return reply
        .status(500)
        .send({ message: 'Erro ao buscar grupos', error: error.message })
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }

      const deleteGrupoUseCase = new DeleteGrupoUseCase(gruposRepositorio)

      console.log({ id })
      await deleteGrupoUseCase.execute(id)

      return reply.status(200).send({ message: 'Grupo deletado com sucesso' })
    } catch (error) {
      console.log(error)
      return reply
        .status(500)
        .send({ message: 'Erro ao deletar grupo', error: error.message })
    }
  }
}
