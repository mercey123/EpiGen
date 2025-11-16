export const apiExamples = {
  createProblem: async () => {
    const response = await fetch('/api/problems/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description:
          'Young people experience financial stress because they lack financial literacy',
        tags: ['financial literacy', 'youth', 'stress'],
      }),
    })

    const data = await response.json()

    if (data.existingTreeId) {
      console.log('Found an existing problem:', data.existingTreeId)
      return data.existingTreeId
    } else if (data.newTree) {
      console.log('Created a new decision tree:', data.newTree.id)
      return data.newTree
    }
  },

  findAlternativeSolution: async (nodeId: string, treeId: string) => {
    const response = await fetch('/api/solutions/alternative', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        treeId,
        reason: 'None of the existing solutions work for the user',
      }),
    })

    const data = await response.json()
    console.log('Added a new solution:', data.newNodeId)
    return data
  },

  search: async (description?: string, tags?: string[]) => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        tags,
        limit: 10,
      }),
    })

    const data = await response.json()
    console.log('Trees found:', data.trees.length)
    console.log('Nodes found:', data.nodes.length)
    return data
  },

  getTree: async (treeId: string) => {
    const response = await fetch(`/api/trees/${treeId}`)
    const tree = await response.json()
    console.log('Decision tree:', tree.id)
    return tree
  },
}
