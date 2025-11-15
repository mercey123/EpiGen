export const apiExamples = {
  createProblem: async () => {
    const response = await fetch('/api/problems/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description:
          'Молодые люди испытывают финансовый стресс из-за отсутствия финансовой грамотности',
        tags: ['финансовая грамотность', 'молодежь', 'стресс'],
      }),
    })

    const data = await response.json()

    if (data.existingTreeId) {
      console.log('Найдена существующая проблема:', data.existingTreeId)
      return data.existingTreeId
    } else if (data.newTree) {
      console.log('Создано новое дерево решений:', data.newTree.id)
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
        reason: 'Все существующие решения не подходят пользователю',
      }),
    })

    const data = await response.json()
    console.log('Добавлено новое решение:', data.newNodeId)
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
    console.log('Найдено деревьев:', data.trees.length)
    console.log('Найдено нод:', data.nodes.length)
    return data
  },

  getTree: async (treeId: string) => {
    const response = await fetch(`/api/trees/${treeId}`)
    const tree = await response.json()
    console.log('Дерево решений:', tree.id)
    return tree
  },
}
