export const useDecisionTree = () => {
  const createProblem = async (
    request: CreateProblemRequest,
  ): Promise<CreateProblemResponse> => {
    const response = await $fetch<CreateProblemResponse>(
      '/api/problems/create',
      {
        method: 'POST',
        body: request,
      },
    )
    return response
  }

  const findAlternativeSolution = async (
    request: AlternativeSolutionRequest,
  ): Promise<AlternativeSolutionResponse> => {
    const response = await $fetch<AlternativeSolutionResponse>(
      '/api/solutions/alternative',
      {
        method: 'POST',
        body: request,
      },
    )
    return response
  }

  const search = async (request: SearchRequest): Promise<SearchResponse> => {
    const response = await $fetch<SearchResponse>('/api/search', {
      method: 'POST',
      body: request,
    })
    return response
  }

  const getTree = async (id: string): Promise<DecisionTree> => {
    const response = await $fetch<DecisionTree>(`/api/trees/${id}`)
    return response
  }

  const getAllTrees = async (): Promise<DecisionTree[]> => {
    const response = await $fetch<DecisionTree[]>('/api/trees')
    return response
  }

  return {
    createProblem,
    findAlternativeSolution,
    search,
    getTree,
    getAllTrees,
  }
}
