<script setup lang="ts">
import { decisionTreeToSkillNodes } from '~/utils/decisionTreeToSkillTree'

const { search, getTree } = useDecisionTree()

const searchDescription = ref('')
const searchTags = ref<string[]>([])
const currentTag = ref('')
const searchResults = ref<{
  trees: DecisionTree[]
  nodes: DecisionNode[]
}>({
  trees: [],
  nodes: [],
})
const isLoading = ref(false)
const selectedTree = ref<DecisionTree | null>(null)
const selectedNode = ref<DecisionNode | null>(null)

const addTag = () => {
  if (
    currentTag.value.trim() &&
    !searchTags.value.includes(currentTag.value.trim())
  ) {
    searchTags.value.push(currentTag.value.trim())
    currentTag.value = ''
  }
}

const removeTag = (tag: string) => {
  searchTags.value = searchTags.value.filter(t => t !== tag)
}

const handleSearch = async () => {
  isLoading.value = true

  try {
    const results = await search({
      description: searchDescription.value || undefined,
      tags: searchTags.value.length > 0 ? searchTags.value : undefined,
      limit: 20,
    })

    searchResults.value = results
  } catch (e: any) {
    console.error('Search error:', e)
  } finally {
    isLoading.value = false
  }
}

const handleTreeClick = async (treeId: string) => {
  const tree = await getTree(treeId)
  selectedTree.value = tree
}

const handleNodeClick = (node: DecisionNode) => {
  selectedNode.value = node
}

const handleBackgroundClick = () => {
  selectedNode.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Поиск</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Поиск по описанию и тегам</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <UInput
            v-model="searchDescription"
            placeholder="Введите описание для поиска..."
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Теги
          </label>
          <div class="flex gap-2 mb-2">
            <UInput
              v-model="currentTag"
              placeholder="Добавить тег"
              @keyup.enter="addTag"
            />
            <UButton @click="addTag">Добавить</UButton>
          </div>
          <div v-if="searchTags.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="tag in searchTags"
              :key="tag"
              class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
            >
              {{ tag }}
              <button
                @click="removeTag(tag)"
                class="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <UButton :loading="isLoading" @click="handleSearch" color="primary">
          Поиск
        </UButton>
      </div>

      <div
        v-if="searchResults.trees.length > 0 || searchResults.nodes.length > 0"
        class="grid grid-cols-2 gap-6"
      >
        <div>
          <h2 class="text-xl font-semibold mb-4">
            Найдено деревьев: {{ searchResults.trees.length }}
          </h2>
          <div class="space-y-2">
            <div
              v-for="tree in searchResults.trees"
              :key="tree.id"
              class="p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition"
              @click="handleTreeClick(tree.id)"
            >
              <div class="font-semibold">
                {{
                  tree.nodes.find(n => n.id === tree.rootNodeId)?.title ||
                  'Без названия'
                }}
              </div>
              <div class="text-sm text-gray-500 mt-1">ID: {{ tree.id }}</div>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-semibold mb-4">
            Найдено узлов: {{ searchResults.nodes.length }}
          </h2>
          <div class="space-y-2">
            <div
              v-for="node in searchResults.nodes"
              :key="node.id"
              class="p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition"
              @click="handleNodeClick(node)"
            >
              <div class="font-semibold">{{ node.title }}</div>
              <div class="text-sm text-gray-500 mt-1">
                {{ node.type }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedTree" class="mt-6 bg-white rounded-lg shadow p-6">
        <div class="mb-4 flex justify-between items-center">
          <h2 class="text-xl font-semibold">Выбранное дерево</h2>
          <UButton color="gray" variant="ghost" @click="selectedTree = null">
            Закрыть
          </UButton>
        </div>

        <div
          class="relative border rounded-lg overflow-hidden bg-white"
          style="height: 600px"
        >
          <SkillTree
            :skills="decisionTreeToSkillNodes(selectedTree)"
            :selected-node-id="
              selectedNode ? `${selectedTree.id}-${selectedNode.id}` : null
            "
            :width="1200"
            :height="600"
            @node-click="
              node => {
                const match = node.id.match(/^tree_\d+_\w+-(.+)$/)
                if (match && match[1]) {
                  const nodeId = match[1]
                  const foundNode = selectedTree.nodes.find(
                    n => n.id === nodeId,
                  )
                  if (foundNode) handleNodeClick(foundNode)
                }
              }
            "
            @background-click="handleBackgroundClick"
          />
        </div>
      </div>
    </div>

    <SkillDescription
      v-if="selectedNode"
      :selected-node="{
        id: selectedTree
          ? `${selectedTree.id}-${selectedNode.id}`
          : selectedNode.id,
        label: selectedNode.title,
        descriptions: [selectedNode.description],
        score:
          selectedNode.type === 'problem'
            ? 50
            : selectedNode.type === 'solution'
              ? 75
              : 100,
      }"
    />
  </div>
</template>
