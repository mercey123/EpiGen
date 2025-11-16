# API Documentation

## Environment Variables

Create a `.env` file in the root directory:

```env
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-pro
```

Or use:

```env
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-pro
```

Get your API key from [Google AI Studio](https://ai.google.com/studio)

## Endpoints

### 1. Create Problem

**POST** `/api/problems/create`

Creates a new problem or returns a reference to an existing one.

**Request Body:**

```json
{
  "description": "Young people experience financial stress due to a lack of financial literacy",
  "tags": ["financial literacy", "youth", "stress"]
}
```

**Response:**

```json
{
  "existingTreeId": "tree_1234567890_abc" // if a similar problem is found
}
```

or

```json
{
  "newTree": {
    "id": "tree_1234567890_abc",
    "rootNodeId": "node_root_123",
    "nodes": [...],
    "edges": [...],
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

### 2. Find Alternative Solution

**POST** `/api/solutions/alternative`

Generates an alternative solution for an existing node.

**Request Body:**

```json
{
  "nodeId": "node_solution_123",
  "treeId": "tree_1234567890_abc",
  "reason": "None of the existing solutions work for the user"
}
```

**Response:**

```json
{
  "tree": {
    "id": "tree_1234567890_abc",
    "nodes": [...],
    "edges": [...]
  },
  "newNodeId": "node_solution_456",
  "newEdgeId": "edge_789"
}
```

### 3. Search

**POST** `/api/search`

Search by description and tags.

**Request Body:**

```json
{
  "description": "financial literacy",
  "tags": ["youth"],
  "limit": 10
}
```

**Response:**

```json
{
  "nodes": [
    {
      "id": "node_123",
      "type": "problem",
      "title": "...",
      "description": "...",
      "tags": [...]
    }
  ],
  "trees": [
    {
      "id": "tree_123",
      "rootNodeId": "node_root",
      "nodes": [...],
      "edges": [...]
    }
  ]
}
```

### 4. Get Tree

**GET** `/api/trees/:id`

Retrieve a decision tree by ID.

**Response:**

```json
{
  "id": "tree_1234567890_abc",
  "rootNodeId": "node_root_123",
  "nodes": [...],
  "edges": [...],
  "createdAt": "2025-01-20T10:00:00.000Z",
  "updatedAt": "2025-01-20T10:00:00.000Z"
}
```
