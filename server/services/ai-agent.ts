const KNOWLEDGE_BASE = `
Research articles from digiconsumers.fi/en/publications/:

Key articles by Mette Ranta (highest priority):
- Financial Identity Scale: Testing the International Validity
- Young adults' personal concerns during the COVID-19 pandemic in Finland
- The Economic Stress Model in Emerging Adulthood
- Did financial identity moderate young adults' social media use and financial well-being during COVID-19?

Other relevant articles:
- Problematic online behaviours during COVID-19: emerging risks and concerns
- The gig economy in the digital era: platform work as a crutch for precarity?
- Factors preventing young people from protecting their commercial privacy
- ICT engagement and other factors associated with adolescents' financial literacy
- Careful or carefree? Young people and information non-transparency on social media
- Growing up together with artificial intelligence: distribution of agency
- Young people as audiences, consumers and participants in digital news environments

Focus areas:
- Financial literacy and identity among young adults
- Digital consumption behaviors
- Economic stress and well-being
- Privacy and digital environments
- Social media impact on financial decisions
`

export class AIAgentService {
  private async callAI(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error(
        'AI_API_KEY or GEMINI_API_KEY environment variable is not set',
      )
    }

    const model = process.env.AI_MODEL || 'gemini-pro'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }

    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${error}`)
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts) {
      return data.candidates[0].content.parts[0].text || ''
    }

    throw new Error('Invalid response format from Gemini API')
  }

  async createProblemTree(
    request: CreateProblemRequest,
  ): Promise<DecisionTree> {
    const systemPrompt = `You are an expert in financial literacy, digital consumption, and youth well-being based on research from digiconsumers.fi publications. 
${KNOWLEDGE_BASE}

Generate a decision tree structure in JSON format. The tree should have:
- A root problem node
- 2-4 intermediate solution nodes
- 1-3 final solution nodes
- Edges connecting nodes logically

Return JSON with this structure:
{
  "rootNode": {
    "id": "string",
    "type": "problem",
    "title": "string",
    "description": "string",
    "tags": ["string"]
  },
  "intermediateNodes": [
    {
      "id": "string",
      "type": "solution",
      "title": "string",
      "description": "string",
      "tags": ["string"]
    }
  ],
  "finalNodes": [
    {
      "id": "string",
      "type": "final",
      "title": "string",
      "description": "string",
      "tags": ["string"]
    }
  ],
  "edges": [
    {
      "fromNodeId": "string",
      "toNodeId": "string",
      "description": "string"
    }
  ]
}`

    const prompt = `Create a decision tree for the following problem:

Problem description: ${request.description}
${request.tags ? `Tags: ${request.tags.join(', ')}` : ''}

Generate a comprehensive decision tree with multiple solution paths based on research from digiconsumers.fi publications, especially focusing on Mette Ranta's work on financial identity and well-being.`

    const response = await this.callAI(prompt, systemPrompt)
    const treeData = JSON.parse(response)

    const treeId = `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const nodes: DecisionNode[] = [
      {
        ...treeData.rootNode,
        metadata: {
          source: 'digiconsumers.fi',
          createdAt: now,
        },
      },
      ...treeData.intermediateNodes.map((node: any) => ({
        ...node,
        metadata: {
          source: 'digiconsumers.fi',
          createdAt: now,
        },
      })),
      ...treeData.finalNodes.map((node: any) => ({
        ...node,
        metadata: {
          source: 'digiconsumers.fi',
          createdAt: now,
        },
      })),
    ]

    const edges: DecisionEdge[] = treeData.edges.map(
      (edge: any, index: number) => ({
        id: `edge_${Date.now()}_${index}`,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        description: edge.description,
        rating: 0,
        ratingCount: 0,
      }),
    )

    return {
      id: treeId,
      rootNodeId: treeData.rootNode.id,
      nodes,
      edges,
      createdAt: now,
      updatedAt: now,
    }
  }

  async findAlternativeSolution(
    request: AlternativeSolutionRequest,
    existingTree: DecisionTree,
  ): Promise<{ newNode: DecisionNode; newEdge: DecisionEdge }> {
    const systemPrompt = `You are an expert in financial literacy, digital consumption, and youth well-being based on research from digiconsumers.fi publications.
${KNOWLEDGE_BASE}

Generate an alternative solution node and edge in JSON format. The solution should be different from existing solutions but still relevant to the problem context.

Return JSON:
{
  "node": {
    "id": "string",
    "type": "solution",
    "title": "string",
    "description": "string",
    "tags": ["string"]
  },
  "edge": {
    "fromNodeId": "string",
    "toNodeId": "string",
    "description": "string"
  }
}`

    const currentNode = existingTree.nodes.find(
      (n: DecisionNode) => n.id === request.nodeId,
    )
    if (!currentNode) {
      throw new Error(`Node ${request.nodeId} not found in tree`)
    }

    const existingSolutions = existingTree.nodes
      .filter((n: DecisionNode) => n.type === 'solution' || n.type === 'final')
      .map((n: DecisionNode) => `- ${n.title}: ${n.description}`)
      .join('\n')

    const prompt = `Find an alternative solution for the following node in a decision tree:

Current node: ${currentNode.title}
Description: ${currentNode.description}
${request.reason ? `Reason for alternative: ${request.reason}` : ''}

Existing solutions (avoid similar approaches):
${existingSolutions}

Generate a new alternative solution based on research from digiconsumers.fi publications, especially Mette Ranta's work.`

    const response = await this.callAI(prompt, systemPrompt)
    const solutionData = JSON.parse(response)

    const newNode: DecisionNode = {
      ...solutionData.node,
      metadata: {
        source: 'digiconsumers.fi',
        createdAt: new Date().toISOString(),
      },
    }

    const newEdge: DecisionEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromNodeId: request.nodeId,
      toNodeId: solutionData.node.id,
      description: solutionData.edge.description,
      rating: 0,
      ratingCount: 0,
    }

    return { newNode, newEdge }
  }

  async searchSimilarProblem(
    description: string,
    existingTrees: DecisionTree[],
  ): Promise<DecisionTree | null> {
    const systemPrompt = `You are an expert in financial literacy, digital consumption, and youth well-being.
${KNOWLEDGE_BASE}

Analyze if the given problem description matches any existing problems. Return JSON:
{
  "matches": true/false,
  "similarity": 0.0-1.0,
  "treeId": "string or null",
  "reason": "string"
}`

    const existingProblems = existingTrees
      .map(tree => {
        const rootNode = tree.nodes.find(
          (n: DecisionNode) => n.id === tree.rootNodeId,
        )
        return {
          treeId: tree.id,
          problem: rootNode?.title || '',
          description: rootNode?.description || '',
        }
      })
      .map(p => `Tree ${p.treeId}: ${p.problem} - ${p.description}`)
      .join('\n\n')

    const prompt = `Check if this problem matches any existing problems:

New problem: ${description}

Existing problems:
${existingProblems || 'None'}

Return JSON with match analysis.`

    const response = await this.callAI(prompt, systemPrompt)
    const analysis = JSON.parse(response)

    if (analysis.matches && analysis.similarity > 0.7 && analysis.treeId) {
      return existingTrees.find(t => t.id === analysis.treeId) || null
    }

    return null
  }
}
