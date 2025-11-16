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
  mode: 'default' | 'alternative'
  width?: number
  height?: number
  selectedNodeId?: string | null
  verticalGap?: number
  horizontalGap?: number
  nodeSizing?: SkillNodeSizing
  highlightNodeIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  width: SETTINGS.viewport.width,
  height: SETTINGS.viewport.height,
  selectedNodeId: null,
  verticalGap: SETTINGS.layout.verticalGap,
  horizontalGap: SETTINGS.layout.horizontalGap,
  nodeSizing: () => ({ ...SETTINGS.node }),
  highlightNodeIds: () => [],
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
const activeNodeIds = computed(() => new Set(props.highlightNodeIds || []))

const visibleTreeNodes = computed(() =>
  treeNodes.value.filter(node => !node.data.hidden),
)

const visibleTreeLinks = computed(() =>
  treeLinks.value.filter(
    link => !link.source.data.hidden && !link.target.data.hidden,
  ),
)

const visibleMergeLinks = computed(() =>
  mergeLinks.value.filter(
    link => !link.source.data.hidden && !link.target.data.hidden,
  ),
)

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

const isNodeInSelectedBranch = (
  node?: d3.HierarchyPointNode<SkillNode>,
): boolean => {
  if (!props.selectedNodeId || !node) return false
  return highlightedIds.value.has(node.data.id)
}

const sortedTreeNodes = computed(() => {
  const nodes = visibleTreeNodes.value

  if (!props.selectedNodeId) return nodes

  return [...nodes].sort((a, b) => {
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

const calculateNodeSize = (
  label: string,
  disableLabelClamp: boolean,
): { width: number; height: number } => {
  if (typeof document === 'undefined') {
    return {
      width: props.nodeSizing.minWidth,
      height: props.nodeSizing.minHeight,
    }
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.style.position = 'absolute'
  svg.style.visibility = 'hidden'
  svg.style.width = '0'
  svg.style.height = '0'
  document.body.appendChild(svg)

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.setAttribute('font-size', `${props.nodeSizing.fontSize}`)
  text.setAttribute('font-family', 'sans-serif')
  text.setAttribute('font-weight', '600')
  text.textContent = label
  svg.appendChild(text)

  const bbox = text.getBBox()
  document.body.removeChild(svg)

  const widthWithPadding = bbox.width + props.nodeSizing.horizontalPadding
  const heightWithPadding = bbox.height + props.nodeSizing.verticalPadding

  return {
    width: Math.max(props.nodeSizing.minWidth, widthWithPadding),
    height: Math.max(props.nodeSizing.minHeight, heightWithPadding),
  }
}

const adjustNodePositionsByLevel = (
  nodes: d3.HierarchyPointNode<SkillNode>[],
  selectedNodeId: string | null | undefined,
): void => {
  const nodesByDepth = new Map<number, d3.HierarchyPointNode<SkillNode>[]>()
  const nodeSizes = new Map<string, { width: number; height: number }>()

  const nodesMap = new Map<string, d3.HierarchyPointNode<SkillNode>>()
  nodes.forEach(node => {
    nodesMap.set(node.data.id, node)
  })

  const getHighlightedIds = (): Set<string> => {
    if (!selectedNodeId) return new Set<string>()

    const reachableIds = new Set<string>([selectedNodeId])
    const traverseParents = (nodeData?: SkillNode | null) => {
      if (!nodeData?.parentIds) return
      nodeData.parentIds.forEach(parentId => {
        if (reachableIds.has(parentId)) return
        reachableIds.add(parentId)
        const parentNode = nodesMap.get(parentId)
        traverseParents(parentNode?.data)
      })
    }

    const selectedNode = nodesMap.get(selectedNodeId)
    traverseParents(selectedNode?.data)

    return reachableIds
  }

  const highlightedIdsSet = getHighlightedIds()

  nodes.forEach(node => {
    if (node.data.hidden) return

    const depth = node.depth ?? 0
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, [])
    }
    nodesByDepth.get(depth)!.push(node)

    const isInSelectedBranch = selectedNodeId
      ? highlightedIdsSet.has(node.data.id)
      : false
    const size = calculateNodeSize(node.data.label, isInSelectedBranch)
    nodeSizes.set(node.data.id, size)
  })

  nodesByDepth.forEach((levelNodes, depth) => {
    if (levelNodes.length === 0) return

    levelNodes.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x
      return a.y - b.y
    })

    const firstNode = levelNodes[0]
    if (!firstNode) return

    const levelY = firstNode.y
    let currentX = 0

    levelNodes.forEach((node, index) => {
      const size = nodeSizes.get(node.data.id) || {
        width: props.nodeSizing.minWidth,
        height: props.nodeSizing.minHeight,
      }

      if (index === 0) {
        node.x = currentX + size.width / 2
        node.y = levelY
        currentX += size.width
      } else {
        const prevNode = levelNodes[index - 1]
        if (!prevNode) return

        const prevSize = nodeSizes.get(prevNode.data.id) || {
          width: props.nodeSizing.minWidth,
          height: props.nodeSizing.minHeight,
        }

        currentX += props.horizontalGap
        node.x = currentX + size.width / 2
        node.y = levelY
        currentX += size.width
      }
    })

    const totalWidth = currentX
    const centerOffset = (props.width - totalWidth) / 2
    levelNodes.forEach(node => {
      node.x += centerOffset
    })
  })
}

const buildTreeLayout = () => {
  if (!props.skills || props.skills.length === 0) return
  if (typeof document === 'undefined') return

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

  adjustNodePositionsByLevel(nodes, props.selectedNodeId)

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

const getHorizontalPanScale = (): number => {
  if (!svgRef.value) return 1
  const rect = svgRef.value.getBoundingClientRect()
  if (!rect.width || !props.width) return 1
  return Math.max(1, rect.width / props.width)
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
  const effectiveScaleX = scaleX * getHorizontalPanScale()

  const viewBoxX =
    (event.clientX - rect.left) * effectiveScaleX + currentViewBox.x
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
  const effectiveScaleX = scaleX * getHorizontalPanScale()

  const currentViewBoxX = (event.clientX - rect.left) * effectiveScaleX
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
    () => props.nodeSizing,
  ],
  () => {
    applyViewportDimensions()
    buildTreeLayout()
  },
  { deep: true },
)

watch(
  () => props.selectedNodeId,
  () => {
    buildTreeLayout()
  },
)

const isDarkMode = ref(false)

const updateDarkMode = () => {
  if (typeof window === 'undefined') return
  isDarkMode.value = document.documentElement.classList.contains('dark')
}

onMounted(() => {
  updateDarkMode()
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver(updateDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    onBeforeUnmount(() => observer.disconnect())
  }
})

const dotPatternId = computed(() =>
  isDarkMode.value ? 'dot-pattern-dark' : 'dot-pattern',
)

const backgroundBounds = computed(() => {
  const largeSize = 50000
  const halfSize = largeSize / 2

  if (treeNodes.value.length === 0) {
    return {
      x: -halfSize,
      y: -halfSize,
      width: largeSize,
      height: largeSize,
    }
  }

  const nodes = treeNodes.value.filter(node => !node.data.hidden)
  if (nodes.length === 0) {
    return {
      x: -halfSize,
      y: -halfSize,
      width: largeSize,
      height: largeSize,
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(node => {
    const size = calculateNodeSize(node.data.label, false)
    const halfWidth = size.width / 2
    const halfHeight = size.height / 2

    minX = Math.min(minX, node.x - halfWidth)
    minY = Math.min(minY, node.y - halfHeight)
    maxX = Math.max(maxX, node.x + halfWidth)
    maxY = Math.max(maxY, node.y + halfHeight)
  })

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return {
    x: centerX - halfSize,
    y: centerY - halfSize,
    width: largeSize,
    height: largeSize,
  }
})
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
      <defs>
        <pattern
          id="dot-pattern"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="1.5" fill="#cbd5e1" />
        </pattern>
        <pattern
          id="dot-pattern-dark"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="1.5" fill="#374151" />
        </pattern>
      </defs>
      <rect
        :x="backgroundBounds.x"
        :y="backgroundBounds.y"
        :width="backgroundBounds.width"
        :height="backgroundBounds.height"
        :fill="`url(#${dotPatternId})`"
        class="pointer-events-none"
      />
      <g>
        <g class="links">
          <path
            v-for="(link, index) in visibleTreeLinks"
            :key="`link-${index}`"
            :d="buildCurvedLinkPath(link.source, link.target)"
            fill="none"
            :style="getLinkStrokeStyle(link.target)"
            class="pointer-events-none stroke-2"
          />
          <path
            v-for="(link, index) in visibleMergeLinks"
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
            :mode="mode"
            :key="node.data.id"
            :node="node"
            :node-data="node.data"
            :is-dimmed="isNodeDimmed(node)"
            :disable-label-clamp="isNodeInSelectedBranch(node)"
            :sizing="nodeSizing"
            :is-active="activeNodeIds.has(node.data.id)"
            @click="emit('nodeClick', node.data)"
          />
        </g>
      </g>
    </svg>
  </div>
</template>
