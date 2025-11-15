const trees: Map<string, DecisionTree> = new Map()

export function saveTree(tree: DecisionTree): void {
  trees.set(tree.id, tree)
}

export function getTree(id: string): DecisionTree | undefined {
  return trees.get(id)
}

export function getAllTrees(): DecisionTree[] {
  return Array.from(trees.values())
}

export function updateTree(
  id: string,
  updates: Partial<DecisionTree>,
): DecisionTree | null {
  const tree = trees.get(id)
  if (!tree) {
    return null
  }

  const updatedTree: DecisionTree = {
    ...tree,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  trees.set(id, updatedTree)
  return updatedTree
}

export function searchTrees(query: {
  description?: string
  tags?: string[]
}): DecisionTree[] {
  const allTrees = getAllTrees()

  if (!query.description && !query.tags) {
    return allTrees
  }

  return allTrees.filter(tree => {
    const rootNode = tree.nodes.find(n => n.id === tree.rootNodeId)
    if (!rootNode) return false

    let matches = true

    if (query.description) {
      const descLower = query.description.toLowerCase()
      const matchesDescription =
        rootNode.title.toLowerCase().includes(descLower) ||
        rootNode.description.toLowerCase().includes(descLower) ||
        tree.nodes.some(
          (n: DecisionNode) =>
            n.title.toLowerCase().includes(descLower) ||
            n.description.toLowerCase().includes(descLower),
        )
      matches = matches && matchesDescription
    }

    if (query.tags && query.tags.length > 0) {
      const matchesTags = tree.nodes.some((n: DecisionNode) =>
        query.tags!.some(tag => n.tags.includes(tag)),
      )
      matches = matches && matchesTags
    }

    return matches
  })
}

export function searchNodes(query: {
  description?: string
  tags?: string[]
}): DecisionTree['nodes'] {
  const allTrees = getAllTrees()
  const allNodes: DecisionTree['nodes'] = []

  allTrees.forEach(tree => {
    allNodes.push(...tree.nodes)
  })

  if (!query.description && !query.tags) {
    return allNodes
  }

  return allNodes.filter((node: DecisionNode) => {
    let matches = true

    if (query.description) {
      const descLower = query.description.toLowerCase()
      const matchesDescription =
        node.title.toLowerCase().includes(descLower) ||
        node.description.toLowerCase().includes(descLower)
      matches = matches && matchesDescription
    }

    if (query.tags && query.tags.length > 0) {
      const matchesTags = query.tags.some(tag => node.tags.includes(tag))
      matches = matches && matchesTags
    }

    return matches
  })
}
