<script setup lang="ts">
import * as d3 from 'd3'
import type { SkillNode } from '~/types/skillTree'
import {
  SKILL_TREE_CONSTANTS,
  SKILL_TREE_DEFAULT_SETTINGS as SETTINGS,
  type SkillNodeSizing,
} from '~/constants/skillTree'
import { getScoreColorRgb } from '~/utils/colors'

interface Props {
  skills: SkillNode[]
  width?: number
  height?: number
  selectedNodeId?: string | null
  verticalGap?: number
  horizontalGap?: number
  nodeSizing?: SkillNodeSizing
}

const props = withDefaults(defineProps<Props>(), {
  width: SETTINGS.viewport.width,
  height: SETTINGS.viewport.height,
  selectedNodeId: null,
  verticalGap: SETTINGS.layout.verticalGap,
  horizontalGap: SETTINGS.layout.horizontalGap,
  nodeSizing: () => ({ ...SETTINGS.node }),
})

const emit = defineEmits<{
  nodeClick: [node: SkillNode]
  backgroundClick: []
}>()

const svgRef = ref<SVGSVGElement | null>(null)

const isPanning = ref(false)
const cursorHasMoved = ref(false)
const panOffset = ref({ x: 0, y: 0 })
const panStartPoint = ref({ x: 0, y: 0 })
const cursorDownPosition = ref({ x: 0, y: 0 })

const treeNodes = ref<d3.HierarchyPointNode<SkillNode>[]>([])
const treeLinks = ref<d3.HierarchyPointLink<SkillNode>[]>([])
const mergeLinks = ref<
  Array<{
    source: d3.HierarchyPointNode<SkillNode>
    target: d3.HierarchyPointNode<SkillNode>
  }>
>([])
const nodesById = ref(new Map<string, d3.HierarchyPointNode<SkillNode>>())
const nodeSizing = computed(() => props.nodeSizing)

const highlightedIds = computed(() => {
  if (!props.selectedNodeId) {
    return new Set<string>()
  }

  const reachableIds = new Set<string>([props.selectedNodeId])
  const traverseParents = (nodeData?: SkillNode | null) => {
    if (!nodeData?.parentIds) return
    nodeData.parentIds.forEach(parentId => {
      if (reachableIds.has(parentId)) return
      reachableIds.add(parentId)
      const parentNode = nodesById.value.get(parentId)
      traverseParents(parentNode?.data)
    })
  }

  const selectedNode = nodesById.value.get(props.selectedNodeId)
  traverseParents(selectedNode?.data)

  if (!selectedNode && props.selectedNodeId) {
    reachableIds.add(props.selectedNodeId)
  }

  return reachableIds
})

const isNodeDimmed = (node?: d3.HierarchyPointNode<SkillNode>): boolean => {
  if (!props.selectedNodeId) return false
  if (!node) return true
  const nodeId = node.data.id
  return !highlightedIds.value.has(nodeId)
}

const sortedTreeNodes = computed(() => {
  if (!props.selectedNodeId) return treeNodes.value

  return [...treeNodes.value].sort((a, b) => {
    const aHighlighted = highlightedIds.value.has(a.data.id)
    const bHighlighted = highlightedIds.value.has(b.data.id)

    if (aHighlighted === bHighlighted) return 0
    return aHighlighted ? 1 : -1
  })
})

const getLinkStrokeStyle = (
  node?: d3.HierarchyPointNode<SkillNode>,
): { stroke: string } => {
  if (isNodeDimmed(node)) {
    return { stroke: SKILL_TREE_CONSTANTS.dimmedLinkColor }
  }

  const rgb = getScoreColorRgb(node?.data?.score)
  return { stroke: `rgb(${rgb})` }
}

const buildCurvedLinkPath = (
  source: d3.HierarchyPointNode<SkillNode>,
  target: d3.HierarchyPointNode<SkillNode>,
): string => {
  const sourceX = source.x
  const sourceY = source.y
  const targetX = target.x
  const targetY = target.y
  const midY = (sourceY + targetY) / 2

  return `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`
}

const buildTreeLayout = () => {
  if (!props.skills || props.skills.length === 0) return

  const hierarchy = d3
    .stratify<SkillNode>()
    .id(d => d.id)
    .parentId(d => {
      if (d.parentIds && d.parentIds.length > 0) {
        return d.parentIds[0]
      }
      return null
    })(props.skills)

  const treeLayout = d3
    .tree<SkillNode>()
    .nodeSize([props.horizontalGap, props.verticalGap])

  const root = treeLayout(hierarchy)

  const nodes = root.descendants()
  const links = root.links()

  const minX = Math.min(...nodes.map(node => node.x))
  const minY = Math.min(...nodes.map(node => node.y))
  const offsetX = props.horizontalGap - minX
  const offsetY = props.verticalGap - minY

  nodes.forEach(node => {
    node.x += offsetX
    node.y += offsetY
  })

  treeNodes.value = nodes
  treeLinks.value = links

  const latestNodeMap = new Map<string, d3.HierarchyPointNode<SkillNode>>()
  treeNodes.value.forEach(node => {
    latestNodeMap.set(node.data.id, node)
  })
  nodesById.value = latestNodeMap

  mergeLinks.value = []
  treeNodes.value.forEach(node => {
    const nodeData = node.data
    if (nodeData.parentIds && nodeData.parentIds.length > 1) {
      nodeData.parentIds.slice(1).forEach(parentId => {
        const parentNode = latestNodeMap.get(parentId)
        if (parentNode) {
          mergeLinks.value.push({
            source: parentNode,
            target: node,
          })
        }
      })
    }
  })
}

const handleNodeClick = (node: SkillNode) => {
  emit('nodeClick', node)
}

const checkIfNodeOrLinkClicked = (target: EventTarget | null): boolean => {
  if (!target) return false
  const element = target as HTMLElement

  const nodeGroup = element.closest('g.nodes')
  if (nodeGroup && nodeGroup.contains(element)) {
    return true
  }

  const linkGroup = element.closest('g.links')
  if (linkGroup && linkGroup.contains(element)) {
    return true
  }

  if (
    element.tagName === 'rect' ||
    element.tagName === 'circle' ||
    element.tagName === 'text' ||
    element.tagName === 'image'
  ) {
    const parent = element.parentElement
    if (parent && parent.classList.contains('cursor-pointer')) {
      return true
    }
  }

  return false
}

const handleBackgroundClick = (event: MouseEvent) => {
  if (!svgRef.value) return

  if (checkIfNodeOrLinkClicked(event.target)) {
    cursorHasMoved.value = false
    return
  }

  if (cursorHasMoved.value) {
    cursorHasMoved.value = false
    return
  }

  emit('backgroundClick')
  cursorHasMoved.value = false
}

const handlePointerDown = (event: PointerEvent) => {
  if (!svgRef.value) return
  if (checkIfNodeOrLinkClicked(event.target)) return

  event.preventDefault()
  isPanning.value = true
  cursorHasMoved.value = false

  const currentViewBox = svgRef.value.viewBox.baseVal
  const rect = svgRef.value.getBoundingClientRect()
  const scaleX = currentViewBox.width / rect.width
  const scaleY = currentViewBox.height / rect.height

  const viewBoxX = (event.clientX - rect.left) * scaleX + currentViewBox.x
  const viewBoxY = (event.clientY - rect.top) * scaleY + currentViewBox.y

  cursorDownPosition.value = {
    x: event.clientX,
    y: event.clientY,
  }

  panStartPoint.value = {
    x: viewBoxX,
    y: viewBoxY,
  }
}

const handlePointerUp = () => {
  isPanning.value = false
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isPanning.value || !svgRef.value) return

  const cursorDeltaX = Math.abs(event.clientX - cursorDownPosition.value.x)
  const cursorDeltaY = Math.abs(event.clientY - cursorDownPosition.value.y)
  if (cursorDeltaX > 5 || cursorDeltaY > 5) {
    cursorHasMoved.value = true
  }

  const currentViewBox = svgRef.value.viewBox.baseVal
  const rect = svgRef.value.getBoundingClientRect()
  const scaleX = currentViewBox.width / rect.width
  const scaleY = currentViewBox.height / rect.height

  const currentViewBoxX = (event.clientX - rect.left) * scaleX
  const currentViewBoxY = (event.clientY - rect.top) * scaleY

  panOffset.value = {
    x: panStartPoint.value.x - currentViewBoxX,
    y: panStartPoint.value.y - currentViewBoxY,
  }

  svgRef.value.setAttribute(
    'viewBox',
    `${panOffset.value.x} ${panOffset.value.y} ${currentViewBox.width} ${currentViewBox.height}`,
  )
}

const applyViewportDimensions = () => {
  if (!svgRef.value) return
  svgRef.value.setAttribute('width', '100%')
  svgRef.value.setAttribute('height', `${props.height}`)
  svgRef.value.setAttribute('viewBox', `0 0 ${props.width} ${props.height}`)
}

onMounted(() => {
  if (!svgRef.value) return

  applyViewportDimensions()
  buildTreeLayout()
})

watch(
  () => props.skills,
  () => {
    buildTreeLayout()
  },
  { deep: true },
)

watch(
  [
    () => props.width,
    () => props.height,
    () => props.verticalGap,
    () => props.horizontalGap,
  ],
  () => {
    applyViewportDimensions()
    buildTreeLayout()
  },
)
</script>

<template>
  <div class="w-full h-full overflow-hidden relative">
    <svg
      ref="svgRef"
      :class="['w-full', isPanning ? 'cursor-grabbing' : 'cursor-grab']"
      @pointerdown="handlePointerDown"
      @pointercancel="handlePointerUp"
      @pointerup="handlePointerUp"
      @pointerleave="handlePointerUp"
      @pointermove="handlePointerMove"
      @click="handleBackgroundClick"
    >
      <g>
        <g class="links">
          <path
            v-for="(link, index) in treeLinks"
            :key="`link-${index}`"
            :d="buildCurvedLinkPath(link.source, link.target)"
            fill="none"
            :style="getLinkStrokeStyle(link.target)"
            class="pointer-events-none stroke-2"
          />
          <path
            v-for="(link, index) in mergeLinks"
            :key="`merge-link-${index}`"
            :d="buildCurvedLinkPath(link.source, link.target)"
            fill="none"
            stroke-dasharray="5,5"
            :style="getLinkStrokeStyle(link.target)"
            class="pointer-events-none stroke-2"
          />
        </g>

        <g class="nodes">
          <SkillNode
            v-for="node in sortedTreeNodes"
            :key="node.data.id"
            :node="node"
            :node-data="node.data"
            :is-dimmed="isNodeDimmed(node)"
            :sizing="nodeSizing"
            @click="handleNodeClick"
          />
        </g>
      </g>
    </svg>
  </div>
</template>
