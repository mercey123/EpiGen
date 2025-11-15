import { searchTrees, searchNodes } from '~~/server/utils/tree-storage'

export default defineEventHandler(async (event): Promise<SearchResponse> => {
  const body = await readBody<SearchRequest>(event)

  const query = {
    description: body.description,
    tags: body.tags,
  }

  const trees = searchTrees(query)
  const nodes = searchNodes(query)

  const limit = body.limit || 50

  return {
    trees: trees.slice(0, limit),
    nodes: nodes.slice(0, limit),
  }
})
