export interface DecisionNode {
  id: string
  type: 'problem' | 'solution' | 'final'
  title: string
  description: string
  tags: string[]
  metadata?: {
    source?: string
    author?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface DecisionEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  rating?: number
  ratingCount?: number
  description?: string
}

export interface DecisionTree {
  id: string
  rootNodeId: string
  nodes: DecisionNode[]
  edges: DecisionEdge[]
  createdAt: string
  updatedAt: string
}

export interface CreateProblemRequest {
  description: string
  tags?: string[]
}

export interface CreateProblemResponse {
  existingTreeId?: string
  newTree?: DecisionTree
}

export interface AlternativeSolutionRequest {
  nodeId: string
  treeId: string
  reason?: string
}

export interface AlternativeSolutionResponse {
  tree: DecisionTree
  newNodeId: string
  newEdgeId: string
}

export interface SearchRequest {
  description?: string
  tags?: string[]
  limit?: number
}

export interface SearchResponse {
  nodes: DecisionNode[]
  trees: DecisionTree[]
}
