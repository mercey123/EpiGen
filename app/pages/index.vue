<script setup lang="ts">
import type { SkillNode } from '~/types/skillTree'
import { decisionTreeToSkillNodes } from '~/utils/decisionTreeToSkillTree'

const { getLatestTree, findAlternativeSolution } = useDecisionTree()
const toast = useToast()

const selectedSkillNode = ref<SkillNode | null>(null)
const fromNodeForAlternative = ref<SkillNode | null>(null)
const toNodeForAlternative = ref<SkillNode | null>(null)
const isAlternativeModeActive = ref(false)
const currentTree = ref<DecisionTree | null>(null)
const isLoadingTrees = ref(true)

const allSkillNodes = computed(() => {
  if (!currentTree.value) {
    return []
  }
  return decisionTreeToSkillNodes(currentTree.value)
})
const { settings: skillTreeSettings } = useSkillTreeSettings()

const isLoading = ref(false)
const isTreeFullscreen = ref(false)
const alternativeReason = ref('')
const previousScrollY = ref(0)
const decisionTreeRef = ref<HTMLElement | null>(null)
const fullscreenViewportHeight = ref(
  skillTreeSettings.value.viewport.height ?? 600,
)

const updateFullscreenViewportHeight = () => {
  if (typeof window === 'undefined') return
  const baseHeight = skillTreeSettings.value.viewport.height ?? 600
  fullscreenViewportHeight.value = Math.max(
    baseHeight,
    window.innerHeight - 120,
  )
}

const computedTreeHeight = computed(() =>
  isTreeFullscreen.value
    ? fullscreenViewportHeight.value
    : skillTreeSettings.value.viewport.height,
)
const hasDecisionTrees = computed(() => !!currentTree.value)
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

const loadLatestTree = async () => {
  isLoadingTrees.value = true
  try {
    const tree = await getLatestTree()
    currentTree.value = tree
  } catch (e: any) {
    console.error('Failed to load trees:', e)
    toast.add({
      title: 'Failed to load trees',
      description: e?.message || 'Please try again later',
      color: 'error',
    })
  } finally {
    isLoadingTrees.value = false
  }
}

onMounted(() => {
  loadLatestTree()
  updateFullscreenViewportHeight()
  window.addEventListener('resize', updateFullscreenViewportHeight)
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', updateFullscreenViewportHeight)
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

const toggleTreeFullscreen = async () => {
  const isEntering = !isTreeFullscreen.value

  if (typeof window !== 'undefined' && isEntering) {
    previousScrollY.value = window.scrollY
    updateFullscreenViewportHeight()
  }

  isTreeFullscreen.value = !isTreeFullscreen.value

  if (typeof window !== 'undefined' && !isTreeFullscreen.value) {
    await nextTick()
    window.scrollTo({ top: previousScrollY.value, behavior: 'auto' })
  }
}

const scrollToDecisionTree = () => {
  if (typeof window === 'undefined' || !decisionTreeRef.value) return

  nextTick(() => {
    decisionTreeRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

const handleNewTreeCreated = (newTree: DecisionTree) => {
  currentTree.value = newTree
  scrollToDecisionTree()
}

const handleAddAlternativeSolution = async () => {
  if (!isAlternativeModeActive.value) {
    toast.add({
      title: 'Activate alternative path mode',
      color: 'warning',
    })
    return
  }

  if (!fromNodeForAlternative.value || !toNodeForAlternative.value) {
    toast.add({
      title: 'Select both nodes',
      description: 'Please specify the start and end of the alternative path',
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
      title: 'Invalid node',
      description: 'The selected node does not belong to the tree',
      color: 'warning',
    })
    return
  }

  if (fromMatch[1] !== toMatch[1]) {
    toast.add({
      title: 'Select nodes from the same tree',
      color: 'warning',
    })
    return
  }

  const treeId = fromMatch[1]

  if (!currentTree.value || currentTree.value.id !== treeId) {
    toast.add({
      title: 'Tree not found',
      color: 'error',
    })
    return
  }

  const fromActualNodeId = fromMatch[2]
  const toActualNodeId = toMatch[2]

  const edgeExists = currentTree.value.edges.some(
    e => e.fromNodeId === fromActualNodeId && e.toNodeId === toActualNodeId,
  )

  if (!edgeExists) {
    toast.add({
      title: 'No direct connection',
      description: 'These nodes are not connected',
      color: 'warning',
    })
    return
  }

  isLoading.value = true

  try {
    const response = await findAlternativeSolution({
      fromNodeId: fromActualNodeId,
      toNodeId: toActualNodeId,
      treeId: currentTree.value.id,
      reason: alternativeReason.value || undefined,
    })

    currentTree.value = response.tree
    alternativeReason.value = ''
    deactivateAlternativeMode()

    const newNodeId = `${response.tree.id}-${response.newNodeId}`
    const newNode = allSkillNodes.value.find(n => n.id === newNodeId)
    if (newNode) {
      selectedSkillNode.value = newNode
    }
  } catch (e: any) {
    toast.add({
      title: 'Could not add alternative path',
      description: e?.message || 'Please try again later',
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
      @decision-trees="handleNewTreeCreated"
      @load-all-trees="loadLatestTree"
    />

    <div
      ref="decisionTreeRef"
      :class="[
        isTreeFullscreen
          ? 'fixed inset-0 z-50 bg-default/95 backdrop-blur-sm overflow-auto p-4'
          : 'relative',
      ]"
    >
      <div class="relative">
        <UCard :ui="{ body: 'p-0 sm:p-0' }">
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold">Decision Tree</h2>
              <div class="flex items-center gap-2">
                <UButton
                  :loading="isLoadingTrees"
                  @click="loadLatestTree"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                >
                  Refresh
                </UButton>
                <UButton
                  :icon="
                    isTreeFullscreen
                      ? 'i-lucide-minimize-2'
                      : 'i-lucide-maximize-2'
                  "
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="toggleTreeFullscreen"
                >
                  {{ isTreeFullscreen ? 'Exit full screen' : 'Full screen' }}
                </UButton>
              </div>
            </div>
          </template>
          <div class="w-full h-full bg-default">
            <div
              v-if="isLoadingTrees"
              class="flex items-center justify-center"
              :style="{ height: `${computedTreeHeight}px` }"
            >
              <div class="text-dimmed">Loading trees...</div>
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
              :height="computedTreeHeight"
              :vertical-gap="skillTreeSettings.layout.verticalGap"
              :horizontal-gap="skillTreeSettings.layout.horizontalGap"
              :node-sizing="skillTreeSettings.node"
              @background-click="selectedSkillNode = null"
              @node-click="handleSkillNodeClick"
            />
            <div
              v-else
              class="flex items-center justify-center text-dimmed"
              :style="{ height: `${computedTreeHeight}px` }"
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
            color="secondary"
            variant="soft"
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
  </div>
</template>
