// Metro configurado para o monorepo pnpm: observa a raiz (para os pacotes
// @wally/*) e resolve node_modules do app e da raiz. Sem isto, o Metro não
// encontra os pacotes de workspace nem suas dependências hasteadas.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// Resolve os pacotes internos a partir do seu código-fonte TS.
config.resolver.disableHierarchicalLookup = false

module.exports = config
