import { getTree } from '~~/server/utils/tree-storage'

export default defineEventHandler(async (event): Promise<DecisionTree> => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tree ID is required',
    })
  }

  const tree = getTree(id)

  if (!tree) {
    throw createError({
      statusCode: 404,
      statusMessage: `Tree ${id} not found`,
    })
  }

  return tree
})
