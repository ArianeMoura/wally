// Metro tuned for the pnpm monorepo: watches the root (for the @wally/*
// packages) and resolves node_modules from both the app and the root. Without
// this, Metro finds neither the workspace packages nor their hoisted deps.
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
// Resolve the internal packages straight from their TypeScript source.
config.resolver.disableHierarchicalLookup = false

module.exports = config
