<script setup lang="ts">
import type { SkillNode } from '~/types/skillTree'
import { getScoreColorRgb } from '~/utils/colors'

interface Props {
  selectedNode: SkillNode | null
}

defineProps<Props>()
</script>

<template>
  <div v-if="selectedNode" class="w-full">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-bold">{{ selectedNode.label }}</h3>
          <div
            v-if="selectedNode.score !== undefined"
            :style="{
              '--bg-color': `rgb(${getScoreColorRgb(selectedNode.score)})`,
            }"
            class="inline-flex items-center justify-center px-3 py-1 rounded-xl text-inverted font-semibold text-sm bg-(--bg-color)"
          >
            {{ selectedNode.score }}
          </div>
        </div>
      </template>

      <div
        v-if="selectedNode.descriptions && selectedNode.descriptions.length > 0"
      >
        <h4 class="font-semibold mb-2">Description</h4>
        <ul class="list-disc list-inside space-y-1">
          <li
            v-for="(desc, index) in selectedNode.descriptions"
            :key="index"
            class="text-sm"
          >
            {{ desc }}
          </li>
        </ul>
      </div>
    </UCard>
  </div>
</template>
