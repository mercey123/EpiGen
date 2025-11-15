<script setup lang="ts">
import type { SkillNode } from '~/types/skillTree'
import { allDecisionTreesToSkillNodes } from '~/utils/decisionTreeToSkillTree'

const { createProblem, getAllTrees, findAlternativeSolution } =
  useDecisionTree()

const selectedSkillNode = ref<SkillNode | null>(null)
const decisionTrees = ref<DecisionTree[]>([])
const isLoadingTrees = ref(true)

const allSkillNodes = computed(() => {
  return allDecisionTreesToSkillNodes(decisionTrees.value)
})

const problemDescription = ref('')
const tags = ref<string[]>([])
const currentTag = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const alternativeReason = ref('')

const loadAllTrees = async () => {
  isLoadingTrees.value = true
  try {
    const trees = await getAllTrees()
    decisionTrees.value = trees
  } catch (e: any) {
    console.error('Ошибка при загрузке деревьев:', e)
    error.value = 'Ошибка при загрузке деревьев'
  } finally {
    isLoadingTrees.value = false
  }
}

onMounted(() => {
  loadAllTrees()
})

const addTag = () => {
  if (
    currentTag.value.trim() &&
    !tags.value.includes(currentTag.value.trim())
  ) {
    tags.value.push(currentTag.value.trim())
    currentTag.value = ''
  }
}

const removeTag = (tag: string) => {
  tags.value = tags.value.filter(t => t !== tag)
}

const handleCreateProblem = async () => {
  if (!problemDescription.value.trim()) {
    error.value = 'Введите описание проблемы'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await createProblem({
      description: problemDescription.value,
      tags: tags.value,
    })

    if (response.existingTreeId) {
      error.value = `Найдена существующая проблема: ${response.existingTreeId}`
      await loadAllTrees()
    } else if (response.newTree) {
      decisionTrees.value.push(response.newTree)
      problemDescription.value = ''
      tags.value = []
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка при создании проблемы'
  } finally {
    isLoading.value = false
  }
}

const handleSkillNodeClick = (node: SkillNode) => {
  selectedSkillNode.value = node
}

const handleBackgroundClick = () => {
  selectedSkillNode.value = null
}

const handleAddAlternativeSolution = async () => {
  if (!selectedSkillNode.value) {
    error.value = 'Выберите узел для добавления альтернативного решения'
    return
  }

  const nodeId = selectedSkillNode.value.id
  const treeIdMatch = nodeId.match(/^(tree_\d+_\w+)-(.+)$/)

  if (!treeIdMatch || !treeIdMatch[1] || !treeIdMatch[2]) {
    error.value = 'Выбранный узел не является частью дерева решений'
    return
  }

  const treeId = treeIdMatch[1]
  const actualNodeId = treeIdMatch[2]
  const tree = decisionTrees.value.find(t => t.id === treeId)

  if (!tree) {
    error.value = 'Дерево не найдено'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await findAlternativeSolution({
      nodeId: actualNodeId,
      treeId: tree.id,
      reason: alternativeReason.value || undefined,
    })

    const treeIndex = decisionTrees.value.findIndex(
      t => t.id === response.tree.id,
    )
    if (treeIndex !== -1) {
      decisionTrees.value[treeIndex] = response.tree
    }
    alternativeReason.value = ''

    const newNodeId = `${response.tree.id}-${response.newNodeId}`
    const newNode = allSkillNodes.value.find(n => n.id === newNodeId)
    if (newNode) {
      selectedSkillNode.value = newNode
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка при добавлении альтернативного решения'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">EpiGen - Деревья решений</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Создать новую проблему</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Описание проблемы
          </label>
          <UTextarea
            v-model="problemDescription"
            placeholder="Опишите проблему..."
            :rows="4"
            class="w-full"
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
          <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="tag in tags"
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

        <UButton
          :loading="isLoading"
          @click="handleCreateProblem"
          color="primary"
        >
          Создать проблему
        </UButton>

        <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {{ error }}
        </div>
      </div>

      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">
              Деревья решений ({{ decisionTrees.length }})
            </h2>
            <UButton
              :loading="isLoadingTrees"
              @click="loadAllTrees"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              Обновить
            </UButton>
          </div>
        </template>
        <div class="w-full h-full bg-white">
          <div
            v-if="isLoadingTrees"
            class="flex items-center justify-center h-[831px]"
          >
            <div class="text-gray-400">Загрузка деревьев...</div>
          </div>
          <SkillTree
            v-else-if="allSkillNodes.length > 0"
            :skills="allSkillNodes"
            :selected-node-id="selectedSkillNode?.id ?? null"
            :width="1281"
            :height="831"
            @node-click="handleSkillNodeClick"
            @background-click="handleBackgroundClick"
          />
          <div
            v-else
            class="flex items-center justify-center h-[831px] text-gray-400"
          >
            Нет деревьев. Создайте новую проблему для начала.
          </div>
        </div>
        <SkillDescription :selected-node="selectedSkillNode" />
      </UCard>

      <div
        v-if="selectedSkillNode && selectedSkillNode.id.includes('tree_')"
        class="mt-6 bg-white rounded-lg shadow p-6"
      >
        <h3 class="font-semibold mb-2">Добавить альтернативное решение</h3>
        <p class="text-sm text-gray-600 mb-2">
          Выбран узел: {{ selectedSkillNode.label }}
        </p>
        <UTextarea
          v-model="alternativeReason"
          placeholder="Причина для альтернативного решения (необязательно)"
          :rows="2"
          class="mb-2"
        />
        <UButton
          :loading="isLoading"
          @click="handleAddAlternativeSolution"
          color="primary"
          size="sm"
        >
          Добавить альтернативное решение
        </UButton>
      </div>
    </div>
  </div>
</template>
