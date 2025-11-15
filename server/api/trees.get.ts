import { getAllTrees } from '~~/server/utils/tree-storage'

export default defineEventHandler(async (event): Promise<DecisionTree[]> => {
  return getAllTrees()
})
