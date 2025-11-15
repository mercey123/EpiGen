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
}>()
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6 w-full">
    <h3 class="font-semibold mb-4">Добавить альтернативный путь</h3>

    <div class="mb-4">
      <p class="text-sm text-gray-600 mb-2">
        Выберите две связанные ноды для создания альтернативного пути между
        ними:
      </p>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">От:</span>
          <UBadge
            v-if="props.fromNode?.label"
            size="sm"
            color="secondary"
            :label="props.fromNode.label"
          />
          <span v-else class="text-sm text-gray-400">Не выбрано</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-gray-700">До:</span>
          <UBadge
            v-if="props.toNode?.label"
            size="sm"
            color="primary"
            :label="props.toNode.label"
          />
          <span v-else class="text-sm text-gray-400">Не выбрано</span>
        </div>
      </div>
      <UButton
        v-if="props.fromNode || props.toNode"
        @click="emit('reset-selection')"
        color="error"
        variant="soft"
        size="xs"
        class="mt-2"
        label="Сбросить выбор"
      />
    </div>

    <div class="mb-4">
      <UTextarea
        :model-value="props.reason"
        placeholder="Почему этот шаг трудно выполнить?"
        :rows="2"
        class="w-full"
        @update:model-value="value => emit('update:reason', value)"
      />
    </div>

    <UButton
      :loading="props.isLoading"
      :disabled="!props.canSubmit"
      @click="emit('submit')"
      :color="props.canSubmit ? 'primary' : 'neutral'"
      size="sm"
      class="w-full"
      label="Добавить альтернативный путь"
    />
  </div>
</template>
