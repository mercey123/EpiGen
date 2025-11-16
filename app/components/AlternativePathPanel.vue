<script setup lang="ts">
import type { SkillNode } from '~/types/skillTree'

interface Props {
  fromNode: SkillNode | null
  toNode: SkillNode | null
  reason: string
  isLoading: boolean
  canSubmit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:reason': [value: string]
  'reset-selection': []
  submit: []
  exit: []
}>()
</script>

<template>
  <div class="bg-default rounded-lg shadow p-6 w-full space-y-4">
    <div class="flex items-start justify-between gap-3">
      <h3 class="font-semibold text-base leading-6">Add alternative path</h3>
      <UButton
        label="Exit"
        size="xs"
        variant="ghost"
        color="error"
        @click="emit('exit')"
      />
    </div>

    <div>
      <p class="text-sm text-toned mb-2">
        Select two connected nodes to create an alternative path between them:
      </p>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-default">From:</span>
          <UBadge
            v-if="props.fromNode?.label"
            size="sm"
            color="secondary"
            :label="props.fromNode.label"
          />
          <span v-else class="text-sm text-dimmed">Not selected</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-default">To:</span>
          <UBadge
            v-if="props.toNode?.label"
            size="sm"
            color="primary"
            :label="props.toNode.label"
          />
          <span v-else class="text-sm text-dimmed">Not selected</span>
        </div>
      </div>
      <UButton
        v-if="props.fromNode || props.toNode"
        @click="emit('reset-selection')"
        color="error"
        variant="soft"
        size="xs"
        class="mt-2"
        label="Reset selection"
      />
    </div>

    <div>
      <UTextarea
        :model-value="props.reason"
        placeholder="Why is this step difficult?"
        :rows="2"
        class="w-full"
        color="neutral"
        variant="outline"
        @update:model-value="value => emit('update:reason', value)"
      />
    </div>

    <UButton
      block
      :loading="props.isLoading"
      :disabled="!props.canSubmit"
      @click="emit('submit')"
      :color="props.canSubmit ? 'primary' : 'neutral'"
      size="sm"
      class="w-full"
      label="Add alternative path"
    />
  </div>
</template>
