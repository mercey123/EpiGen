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

Создает новую проблему или возвращает ссылку на существующую.

**Request Body:**

```json
{
  "description": "Молодые люди испытывают финансовый стресс из-за отсутствия финансовой грамотности",
  "tags": ["финансовая грамотность", "молодежь", "стресс"]
}
```

**Response:**

```json
{
  "existingTreeId": "tree_1234567890_abc" // если найдена похожая проблема
}
```

или

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

Генерирует альтернативное решение для существующей ноды.

**Request Body:**

```json
{
  "nodeId": "node_solution_123",
  "treeId": "tree_1234567890_abc",
  "reason": "Все существующие решения не подходят пользователю"
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

Поиск по описанию и тэгам.

**Request Body:**

```json
{
  "description": "финансовая грамотность",
  "tags": ["молодежь"],
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

Получить дерево решений по ID.

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
