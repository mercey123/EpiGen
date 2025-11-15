<script setup lang="ts">
import type { SkillNode } from '~/types/skillTree'
import { mockSkillTreeData } from '~/data/mockSkillTree'
import {
  SKILL_TREE_DEFAULT_SETTINGS as SETTINGS,
  type SkillTreeSettings,
} from '~/constants/skillTree'

const selectedSkillNode = ref<SkillNode | null>(null)
const skillTreeSettings = useCookie<SkillTreeSettings>('skillTreeSettings', {
  default: () => JSON.parse(JSON.stringify(SETTINGS)),
})

const handleSkillNodeClick = (node: SkillNode) => {
  selectedSkillNode.value = node
}

const handleBackgroundClick = () => {
  selectedSkillNode.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <SkillSettingsPanel v-model="skillTreeSettings" />

    <div class="w-full h-full bg-white">
      <SkillTree
        :skills="mockSkillTreeData"
        :selected-node-id="selectedSkillNode?.id ?? null"
        :width="skillTreeSettings.viewport.width"
        :height="skillTreeSettings.viewport.height"
        :vertical-gap="skillTreeSettings.layout.verticalGap"
        :horizontal-gap="skillTreeSettings.layout.horizontalGap"
        :node-sizing="skillTreeSettings.node"
        @node-click="handleSkillNodeClick"
        @background-click="handleBackgroundClick"
      />
    </div>

    <SkillDescription :selected-node="selectedSkillNode" />
  </div>
</template>
