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

  tree.nodes.forEach(node => {
    const parentIds = nodeToParents.get(node.id) || []

    skillNodes.push({
      id: `${tree.id}-${node.id}`,
      label: node.title,
      parentIds:
        node.id === tree.rootNodeId
          ? undefined
          : parentIds.map(pid => `${tree.id}-${pid}`),
      descriptions: [node.description],
      score: node.type === 'problem' ? 50 : node.type === 'solution' ? 75 : 100,
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
