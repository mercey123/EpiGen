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

Generate a step-by-step instruction tree in JSON format. The tree should be a LINEAR VERTICAL STRUCTURE:
- A root problem node (the problem title, MAXIMUM 15 characters)
- N intermediate step nodes (concrete action steps to achieve the goal, where N is between 2 and 6)
- 1 final goal node (the desired end result)

The structure must be LINEAR: root -> step1 -> step2 -> ... -> stepN -> goal
Each step should be concrete, actionable, and easy to understand for an average person.

IMPORTANT: Determine the optimal number of steps (between 2 and 6) based on:
- Complexity of the problem
- Average person's attention span and comprehension
- Need for clarity and simplicity
- Logical progression from problem to goal

Return JSON with this structure:
{
  "rootNode": {
    "id": "string",
    "type": "problem",
    "title": "string (MAXIMUM 15 characters)",
    "description": "string",
    "tags": ["string"]
  },
  "stepNodes": [
    {
      "id": "string",
      "type": "solution",
      "title": "string",
      "description": "string",
      "tags": ["string"]
    }
  ],
  "goalNode": {
    "id": "string",
    "type": "final",
    "title": "string",
    "description": "string",
    "tags": ["string"]
  }
}

CRITICAL REQUIREMENTS:
- Root node title MUST be maximum 15 characters
- Generate between 2 and 6 step nodes (choose optimal number for clarity)
- Steps should be sequential and logical
- Each step should be simple enough for an average person to understand
- The instruction should be clear and actionable`

    const goalText = request.goal
      ? `Goal: ${request.goal}`
      : 'Generate an appropriate goal based on the problem description.'

    const prompt = `Create a step-by-step instruction tree for achieving a goal:

Problem: ${request.description}
${goalText}
${request.tags ? `Tags: ${request.tags.join(', ')}` : ''}

Analyze the problem complexity and determine the optimal number of steps (between 2 and 6) needed to create a clear, understandable instruction for an average person. Then generate that exact number of sequential action steps that lead from the problem to the goal.

Each step should be concrete, actionable, and easy to understand. The structure should be: Problem -> Step 1 -> Step 2 -> ... -> Step N -> Goal.

IMPORTANT: The root node title must be maximum 15 characters.

Based on research from digiconsumers.fi publications, especially focusing on Mette Ranta's work on financial identity and well-being.`

    const response = await this.callAI(prompt, systemPrompt)
    const treeData = JSON.parse(response)

    const treeId = `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const rootTitle =
      treeData.rootNode.title.length > 15
        ? treeData.rootNode.title.substring(0, 15)
        : treeData.rootNode.title

    const rootNode: DecisionNode = {
      ...treeData.rootNode,
      title: rootTitle,
      metadata: {
        source: 'digiconsumers.fi',
        createdAt: now,
      },
    }

    const stepNodes: DecisionNode[] = treeData.stepNodes.map((node: any) => ({
      ...node,
      metadata: {
        source: 'digiconsumers.fi',
        createdAt: now,
      },
    }))

    const goalNode: DecisionNode = {
      ...treeData.goalNode,
      metadata: {
        source: 'digiconsumers.fi',
        createdAt: now,
      },
    }

    const nodes: DecisionNode[] = [rootNode, ...stepNodes, goalNode]

    const edges: DecisionEdge[] = []
    let previousNodeId = rootNode.id

    stepNodes.forEach((stepNode, index) => {
      edges.push({
        id: `edge_${Date.now()}_${index}`,
        fromNodeId: previousNodeId,
        toNodeId: stepNode.id,
        description: `Step ${index + 1}`,
        rating: 0,
        ratingCount: 0,
      })
      previousNodeId = stepNode.id
    })

    edges.push({
      id: `edge_${Date.now()}_${stepNodes.length}`,
      fromNodeId: previousNodeId,
      toNodeId: goalNode.id,
      description: 'Goal achieved',
      rating: 0,
      ratingCount: 0,
    })

    return {
      id: treeId,
      rootNodeId: rootNode.id,
      nodes,
      edges,
      createdAt: now,
      updatedAt: now,
    }
  }

  async findAlternativeSolution(
    request: AlternativeSolutionRequest,
    existingTree: DecisionTree,
  ): Promise<{
    newNode: DecisionNode
    newEdge: DecisionEdge
    secondEdges: DecisionEdge[]
  }> {
    const fromNode = existingTree.nodes.find(
      (n: DecisionNode) => n.id === request.fromNodeId,
    )
    const toNode = existingTree.nodes.find(
      (n: DecisionNode) => n.id === request.toNodeId,
    )

    if (!fromNode) {
      throw new Error(`From node ${request.fromNodeId} not found in tree`)
    }
    if (!toNode) {
      throw new Error(`To node ${request.toNodeId} not found in tree`)
    }

    const existingEdge = existingTree.edges.find(
      (e: DecisionEdge) =>
        e.fromNodeId === request.fromNodeId && e.toNodeId === request.toNodeId,
    )

    if (!existingEdge) {
      throw new Error(
        `Edge from ${request.fromNodeId} to ${request.toNodeId} not found`,
      )
    }

    const nodesAfterToNode = existingTree.edges
      .filter((e: DecisionEdge) => e.fromNodeId === request.toNodeId)
      .map((e: DecisionEdge) => {
        const node = existingTree.nodes.find(
          (n: DecisionNode) => n.id === e.toNodeId,
        )
        return node
      })
      .filter((n): n is DecisionNode => n !== undefined)

    if (nodesAfterToNode.length === 0) {
      throw new Error(
        `No nodes found after ${request.toNodeId}. Cannot create alternative path that skips this step.`,
      )
    }

    const existingStepNodes = existingTree.nodes
      .filter((n: DecisionNode) => n.type === 'solution')
      .slice(0, 3)
      .map(
        (n: DecisionNode) =>
          `Title: "${n.title}", Description: "${n.description}"`,
      )
      .join('\n')

    const systemPrompt = `You are an expert in financial literacy, digital consumption, and youth well-being based on research from digiconsumers.fi publications.
${KNOWLEDGE_BASE}

Generate an alternative step node that bypasses a difficult step in a decision tree. The alternative step should:
- Start from the same source node
- Lead directly to the nodes that come after the skipped step
- Skip the problematic step completely
- Be a concrete, actionable instruction
- Have the SAME format as existing step nodes (same title length, description style, etc.)

Example step nodes format:
${existingStepNodes || 'Title: "Example step", Description: "Concrete action description"'}

Return JSON:
{
  "node": {
    "id": "string",
    "type": "solution",
    "title": "string (should match the format and length of existing step nodes)",
    "description": "string (should match the format and style of existing step nodes)",
    "tags": ["string"]
  }
}`

    const nodesAfterText = nodesAfterToNode
      .map((n: DecisionNode) => `- ${n.title}: ${n.description}`)
      .join('\n')

    const prompt = `Create an alternative step that SKIPS a difficult step in a decision tree:

From step: ${fromNode.title}
Description: ${fromNode.description}

Step to SKIP (bypass completely): ${toNode.title}
Description: ${toNode.description}

Steps that come AFTER the skipped step (these are the target steps):
${nodesAfterText}
${request.reason ? `\nReason why the step "${toNode.title}" is difficult: ${request.reason}` : ''}

IMPORTANT: The alternative step node must have the EXACT SAME format as existing step nodes:
- Title should be concise and match the style/length of existing step nodes
- Description should match the format and style of existing step nodes
- Should be a concrete, actionable instruction like other step nodes

Generate an alternative step that:
- Starts from "${fromNode.title}"
- SKIPS "${toNode.title}" completely
- Leads directly to the steps that come after "${toNode.title}" (${nodesAfterToNode.map((n: DecisionNode) => n.title).join(', ')})
- Is a concrete, actionable instruction that an average person can understand
- Achieves the same goal but bypasses the problematic step
- Has title and description formatted EXACTLY like the existing step nodes in the tree

Based on research from digiconsumers.fi publications, especially Mette Ranta's work.`

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
      fromNodeId: request.fromNodeId,
      toNodeId: newNode.id,
      description: 'Alternative path',
      rating: 0,
      ratingCount: 0,
    }

    const secondEdges: DecisionEdge[] = nodesAfterToNode.map(
      (targetNode: DecisionNode, index: number) => ({
        id: `edge_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        fromNodeId: newNode.id,
        toNodeId: targetNode.id,
        description: 'Continuation of the alternative path',
        rating: 0,
        ratingCount: 0,
      }),
    )

    return { newNode, newEdge, secondEdges }
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
