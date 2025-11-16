<script setup lang="ts">
import type { SkillNode } from '~/types/skillTree'

const { getAllTrees, findAlternativeSolution } = useDecisionTree()
const toast = useToast()

const selectedSkillNode = ref<SkillNode | null>(null)
const fromNodeForAlternative = ref<SkillNode | null>(null)
const toNodeForAlternative = ref<SkillNode | null>(null)
const isAlternativeModeActive = ref(false)
const decisionTrees = ref<DecisionTree[]>([])
const isLoadingTrees = ref(true)

const allSkillNodes = computed(() => {
  return allDecisionTreesToSkillNodes(decisionTrees.value)
})
const { settings: skillTreeSettings } = useSkillTreeSettings()

const isLoading = ref(false)
const alternativeReason = ref('')
const hasDecisionTrees = computed(() => decisionTrees.value.length > 0)
const highlightedAlternativeNodeIds = computed(() => {
  if (!isAlternativeModeActive.value) {
    return []
  }
  const ids: string[] = []
  if (fromNodeForAlternative.value) {
    ids.push(fromNodeForAlternative.value.id)
  }
  if (toNodeForAlternative.value) {
    ids.push(toNodeForAlternative.value.id)
  }
  return ids
})
const shouldShowSidebar = computed(
  () =>
    !!selectedSkillNode.value ||
    isAlternativeModeActive.value ||
    hasDecisionTrees.value,
)

const loadAllTrees = async () => {
  isLoadingTrees.value = true
  try {
    const trees = await getAllTrees()
    decisionTrees.value = trees
  } catch (e: any) {
    console.error('Ошибка при загрузке деревьев:', e)
    toast.add({
      title: 'Не удалось загрузить деревья',
      description: e?.message || 'Попробуйте ещё раз позже',
      color: 'error',
    })
  } finally {
    isLoadingTrees.value = false
  }
}

onMounted(() => {
  loadAllTrees()
})

const ensureFromBeforeTo = () => {
  if (!fromNodeForAlternative.value || !toNodeForAlternative.value) {
    return
  }

  const indexById = new Map<string, number>()
  allSkillNodes.value.forEach((node, index) => {
    indexById.set(node.id, index)
  })

  const fromIndex =
    indexById.get(fromNodeForAlternative.value.id) ?? Number.POSITIVE_INFINITY
  const toIndex =
    indexById.get(toNodeForAlternative.value.id) ?? Number.POSITIVE_INFINITY

  if (fromIndex > toIndex) {
    const temp = fromNodeForAlternative.value
    fromNodeForAlternative.value = toNodeForAlternative.value
    toNodeForAlternative.value = temp
  }
}

const handleSkillNodeClick = (node: SkillNode) => {
  selectedSkillNode.value = node

  if (!isAlternativeModeActive.value) {
    return
  }

  if (!fromNodeForAlternative.value) {
    fromNodeForAlternative.value = node
    return
  }

  if (
    !toNodeForAlternative.value &&
    fromNodeForAlternative.value.id !== node.id
  ) {
    toNodeForAlternative.value = node
    ensureFromBeforeTo()
  }
}

const resetAlternativeSelection = () => {
  fromNodeForAlternative.value = null
  toNodeForAlternative.value = null
}

const activateAlternativeMode = () => {
  isAlternativeModeActive.value = true
  resetAlternativeSelection()
  alternativeReason.value = ''
}

const deactivateAlternativeMode = () => {
  isAlternativeModeActive.value = false
  resetAlternativeSelection()
  alternativeReason.value = ''
}

const handleAddAlternativeSolution = async () => {
  if (!isAlternativeModeActive.value) {
    toast.add({
      title: 'Активируйте режим альтернативного пути',
      color: 'warning',
    })
    return
  }

  if (!fromNodeForAlternative.value || !toNodeForAlternative.value) {
    toast.add({
      title: 'Выберите обе ноды',
      description: 'Нужно указать начало и конец альтернативного пути',
      color: 'warning',
    })
    return
  }

  const fromNodeId = fromNodeForAlternative.value.id
  const toNodeId = toNodeForAlternative.value.id
  const fromMatch = fromNodeId.match(/^(tree_\d+_\w+)-(.+)$/)
  const toMatch = toNodeId.match(/^(tree_\d+_\w+)-(.+)$/)

  if (
    !fromMatch ||
    !fromMatch[1] ||
    !fromMatch[2] ||
    !toMatch ||
    !toMatch[1] ||
    !toMatch[2]
  ) {
    toast.add({
      title: 'Неверный узел',
      description: 'Выбранная нода не принадлежит дереву',
      color: 'warning',
    })
    return
  }

  if (fromMatch[1] !== toMatch[1]) {
    toast.add({
      title: 'Выберите ноды одного дерева',
      color: 'warning',
    })
    return
  }

  const treeId = fromMatch[1]
  const tree = decisionTrees.value.find(t => t.id === treeId)

  if (!tree) {
    toast.add({
      title: 'Дерево не найдено',
      color: 'error',
    })
    return
  }

  const fromActualNodeId = fromMatch[2]
  const toActualNodeId = toMatch[2]

  const edgeExists = tree.edges.some(
    e => e.fromNodeId === fromActualNodeId && e.toNodeId === toActualNodeId,
  )

  if (!edgeExists) {
    toast.add({
      title: 'Нет прямой связи',
      description: 'Эти ноды не соединены',
      color: 'warning',
    })
    return
  }

  isLoading.value = true

  try {
    const response = await findAlternativeSolution({
      fromNodeId: fromActualNodeId,
      toNodeId: toActualNodeId,
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
    deactivateAlternativeMode()

    const newNodeId = `${response.tree.id}-${response.newNodeId}`
    const newNode = allSkillNodes.value.find(n => n.id === newNodeId)
    if (newNode) {
      selectedSkillNode.value = newNode
    }
  } catch (e: any) {
    toast.add({
      title: 'Не удалось добавить альтернативный путь',
      description: e?.message || 'Попробуйте ещё раз позже',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col container mx-auto px-4 py-8 gap-12 max-w-3xl">
    <div class="flex flex-col items-center gap-4">
      <UBadge
        icon="i-lucide-lightbulb"
        :ui="{
          leadingIcon: 'size-4',
        }"
        class="text-base font-normal px-5 rounded-full"
        color="secondary"
        size="xl"
        variant="soft"
        label="AI-Powered Guidance"
      />
      <span class="text-4xl text-highlighted"> Describe Your Challenge </span>
      <span class="text-base text-toned">
        Tell us about your concern, and we'll create a personalized step-by-step
        mindmap to help you solve it.
      </span>
    </div>

    <NewProblemForm
      @decision-trees="newTree => decisionTrees.push(newTree)"
      @load-all-trees="loadAllTrees"
    />

    <div class="relative">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">
              Decision Trees ({{ decisionTrees.length }})
            </h2>
            <UButton
              :loading="isLoadingTrees"
              @click="loadAllTrees"
              color="neutral"
              variant="ghost"
              size="sm"
            >
              Refresh
            </UButton>
          </div>
        </template>
        <div class="w-full h-full bg-white">
          <div
            v-if="isLoadingTrees"
            class="flex items-center justify-center"
            :style="{ height: `${skillTreeSettings.viewport.height}px` }"
          >
            <div class="text-gray-400">Loading trees...</div>
          </div>
          <SkillTree
            v-else-if="allSkillNodes.length > 0"
            :skills="allSkillNodes"
            :mode="isAlternativeModeActive ? 'alternative' : 'default'"
            :selected-node-id="
              isAlternativeModeActive ? null : (selectedSkillNode?.id ?? null)
            "
            :highlight-node-ids="highlightedAlternativeNodeIds"
            :width="skillTreeSettings.viewport.width"
            :height="skillTreeSettings.viewport.height"
            :vertical-gap="skillTreeSettings.layout.verticalGap"
            :horizontal-gap="skillTreeSettings.layout.horizontalGap"
            :node-sizing="skillTreeSettings.node"
            @background-click="selectedSkillNode = null"
            @node-click="handleSkillNodeClick"
          />
          <div
            v-else
            class="flex items-center justify-center text-gray-400"
            :style="{ height: `${skillTreeSettings.viewport.height}px` }"
          >
            No trees yet. Create a problem to get started.
          </div>
        </div>
      </UCard>

      <div
        v-if="shouldShowSidebar"
        class="absolute top-16 right-1 w-[350px] z-10 flex flex-col items-end gap-4"
      >
        <template v-if="isAlternativeModeActive">
          <AlternativePathPanel
            :from-node="fromNodeForAlternative"
            :to-node="toNodeForAlternative"
            :reason="alternativeReason"
            :is-loading="isLoading"
            :can-submit="!!(fromNodeForAlternative && toNodeForAlternative)"
            @reset-selection="resetAlternativeSelection"
            @update:reason="value => (alternativeReason = value)"
            @submit="handleAddAlternativeSolution"
            @exit="deactivateAlternativeMode"
          />
        </template>
        <UButton
          v-else-if="hasDecisionTrees"
          color="primary"
          size="sm"
          class="w-fit"
          label="Enable alternative path mode"
          @click="activateAlternativeMode"
        />
        <SkillDescription
          v-if="selectedSkillNode"
          :selected-node="selectedSkillNode"
        />
      </div>
    </div>
  </div>
</template>
