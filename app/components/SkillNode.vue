<script setup lang="ts">
import * as d3 from 'd3'
import type { SkillNode } from '~/types/skillTree'
import {
  SKILL_NODE_STYLES as STYLE,
  SKILL_TREE_DEFAULT_SETTINGS as SETTINGS,
  type SkillNodeSizing,
} from '~/constants/skillTree'

interface Props {
  node: d3.HierarchyPointNode<SkillNode>
  nodeData: SkillNode
  mode: 'default' | 'alternative'
  rectWidth?: number
  rectHeight?: number
  isDimmed?: boolean
  disableLabelClamp?: boolean
  sizing?: SkillNodeSizing
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sizing: () => ({ ...SETTINGS.node }),
  disableLabelClamp: false,
  isActive: false,
})

const emit = defineEmits<{
  click: [node: SkillNode]
}>()

const textRef = ref<SVGTextElement | null>(null)
const measuredSize = ref({
  width: props.rectWidth ?? props.sizing.minWidth,
  height: props.rectHeight ?? props.sizing.minHeight,
})

const computedRectWidth = computed(
  () =>
    props.rectWidth ??
    Math.max(props.sizing.minWidth, measuredSize.value.width),
)

const computedRectHeight = computed(
  () =>
    props.rectHeight ??
    Math.max(props.sizing.minHeight, measuredSize.value.height),
)

const labelBoxStyle = computed(() => ({
  fontSize: `${props.sizing.fontSize}px`,
  padding: `${props.sizing.verticalPadding / 2}px ${props.sizing.horizontalPadding / 2}px`,
}))

const nodeBackgroundFillStyle = computed(() => {
  if (props.isDimmed || (props.mode === 'alternative' && !props.isActive)) {
    return { '--fill-color': STYLE.colors.dimmedFill }
  }

  const rgb = getScoreBackgroundColorRgb(props.nodeData.score)
  return { '--fill-color': `rgb(${rgb})` }
})

const nodeStrokeStyle = computed(() => {
  if (props.isDimmed || (props.mode === 'alternative' && !props.isActive)) {
    return { '--stroke-color': STYLE.colors.dimmedStroke }
  }

  const rgb = getScoreColorRgb(props.nodeData.score)
  return { '--stroke-color': `rgb(${rgb})` }
})

const measureLabel = () => {
  if (!textRef.value || props.rectWidth || props.rectHeight) return
  const bbox = textRef.value.getBBox()
  const widthWithPadding = bbox.width + props.sizing.horizontalPadding
  const heightWithPadding = bbox.height + props.sizing.verticalPadding

  measuredSize.value = {
    width: Math.max(props.sizing.minWidth, widthWithPadding),
    height: Math.max(props.sizing.minHeight, heightWithPadding),
  }
}

onMounted(() => {
  nextTick(() => measureLabel())
})

watch(
  () => props.nodeData.label,
  () => {
    nextTick(() => measureLabel())
  },
)

watch(
  () => props.sizing,
  () => {
    measuredSize.value = {
      width: props.rectWidth ?? props.sizing.minWidth,
      height: props.rectHeight ?? props.sizing.minHeight,
    }
    nextTick(() => measureLabel())
  },
  { deep: true },
)

watch(
  () => props.disableLabelClamp,
  () => {
    nextTick(() => measureLabel())
  },
)
</script>

<template>
  <g
    v-if="!nodeData.hidden"
    :transform="`translate(${node.x},${node.y})`"
    class="cursor-pointer"
    @click.stop="emit('click', nodeData)"
  >
    <rect
      :width="computedRectWidth"
      :height="computedRectHeight"
      :x="-computedRectWidth / 2"
      :y="-computedRectHeight / 2"
      :style="{ ...nodeBackgroundFillStyle, ...nodeStrokeStyle }"
      :class="[
        'transition-all fill-(--fill-color) stroke-(--stroke-color)',
        isDimmed ? STYLE.opacityClasses.dimmed : STYLE.opacityClasses.active,
      ]"
      rx="8"
    />

    <foreignObject
      :width="computedRectWidth"
      :height="computedRectHeight"
      :x="-computedRectWidth / 2"
      :y="-computedRectHeight / 2"
      class="pointer-events-none"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        :class="[
          'w-full h-full flex items-center justify-center font-semibold',
          isDimmed ? 'text-dimmed' : 'text-highlighted dark:text-inverted',
        ]"
        :style="labelBoxStyle"
      >
        <span class="truncate w-full text-center block">
          {{ nodeData.label }}
        </span>
      </div>
    </foreignObject>

    <text
      ref="textRef"
      :x="0"
      :y="0"
      text-anchor="middle"
      dominant-baseline="middle"
      class="opacity-0 pointer-events-none select-none"
    >
      {{ nodeData.label }}
    </text>
  </g>
</template>
