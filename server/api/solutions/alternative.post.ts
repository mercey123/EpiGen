import { AIAgentService } from '~~/server/services/ai-agent'
import { getTree, updateTree } from '~~/server/utils/tree-storage'

export default defineEventHandler(
  async (event): Promise<AlternativeSolutionResponse> => {
    const body = await readBody<AlternativeSolutionRequest>(event)

    if (!body.nodeId || !body.treeId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'nodeId and treeId are required',
      })
    }

    const existingTree = getTree(body.treeId)

    if (!existingTree) {
      throw createError({
        statusCode: 404,
        statusMessage: `Tree ${body.treeId} not found`,
      })
    }

    const aiAgent = new AIAgentService()
    const { newNode, newEdge } = await aiAgent.findAlternativeSolution(
      body,
      existingTree,
    )

    const updatedTree = updateTree(body.treeId, {
      nodes: [...existingTree.nodes, newNode],
      edges: [...existingTree.edges, newEdge],
    })

    if (!updatedTree) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update tree',
      })
    }

    return {
      tree: updatedTree,
      newNodeId: newNode.id,
      newEdgeId: newEdge.id,
    }
  },
)
