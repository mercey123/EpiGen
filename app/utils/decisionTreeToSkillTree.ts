import type { SkillNode } from '~/types/skillTree'

export function decisionTreeToSkillNodes(tree: DecisionTree): SkillNode[] {
  const skillNodes: SkillNode[] = []
  const nodeToParents = new Map<string, string[]>()

  tree.edges.forEach(edge => {
    if (!nodeToParents.has(edge.toNodeId)) {
      nodeToParents.set(edge.toNodeId, [])
    }
    nodeToParents.get(edge.toNodeId)!.push(edge.fromNodeId)
  })

  const nodeDepths = new Map<string, number>()
  const calculateDepth = (nodeId: string): number => {
    if (nodeDepths.has(nodeId)) {
      return nodeDepths.get(nodeId)!
    }

    const parents = nodeToParents.get(nodeId) || []
    if (parents.length === 0) {
      nodeDepths.set(nodeId, 0)
      return 0
    }

    const maxParentDepth = Math.max(...parents.map(calculateDepth))
    const depth = maxParentDepth + 1
    nodeDepths.set(nodeId, depth)
    return depth
  }

  tree.nodes.forEach(node => {
    calculateDepth(node.id)
  })

  const maxDepth = Math.max(...Array.from(nodeDepths.values()))

  tree.nodes.forEach(node => {
    const parentIds = nodeToParents.get(node.id) || []
    const depth = nodeDepths.get(node.id) || 0

    let score: number
    if (node.type === 'problem') {
      score = 0
    } else {
      if (maxDepth === 0) {
        score = 100
      } else {
        score = Math.round((depth / maxDepth) * 100)
      }
    }

    skillNodes.push({
      id: `${tree.id}-${node.id}`,
      label: node.title,
      parentIds:
        node.id === tree.rootNodeId
          ? undefined
          : parentIds.map(pid => `${tree.id}-${pid}`),
      descriptions: [node.description],
      score,
    })
  })

  return skillNodes
}

export function allDecisionTreesToSkillNodes(
  trees: DecisionTree[],
): SkillNode[] {
  if (trees.length === 0) {
    return []
  }

  const allSkillNodes: SkillNode[] = []
  const rootNodeId = 'epigen-root'

  allSkillNodes.push({
    id: rootNodeId,
    label: 'EpiGen Trees',
    parentIds: undefined,
    descriptions: ['Root node for every decision tree'],
    score: 0,
    hidden: true,
  })

  trees.forEach(tree => {
    const treeNodes = decisionTreeToSkillNodes(tree)
    const rootNode = treeNodes.find(
      n => n.id === `${tree.id}-${tree.rootNodeId}`,
    )
    if (rootNode) {
      rootNode.parentIds = [rootNodeId]
    }
    allSkillNodes.push(...treeNodes)
  })

  return allSkillNodes
}
