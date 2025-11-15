<script setup lang="ts">
import type { SkillTreeSettings } from '~/constants/skillTree'

const { settings, resetSettings } = useSkillTreeSettings()

const isOpen = ref(false)

const cloneSettings = (value: SkillTreeSettings): SkillTreeSettings =>
  JSON.parse(JSON.stringify(value))

const ensureSettings = (): SkillTreeSettings => {
  if (!settings.value) {
    resetSettings()
  }
  return settings.value as SkillTreeSettings
}

const localSettings = reactive(cloneSettings(ensureSettings()))

const isSyncingFromLocal = ref(false)
const isSyncingFromStore = ref(false)

const syncLocalFromStore = (value: SkillTreeSettings) => {
  isSyncingFromStore.value = true
  Object.assign(localSettings.viewport, value.viewport)
  Object.assign(localSettings.layout, value.layout)
  Object.assign(localSettings.node, value.node)
  isSyncingFromStore.value = false
}

watch(
  () => settings.value,
  value => {
    if (!value || isSyncingFromLocal.value) return
    syncLocalFromStore(value)
  },
  { deep: true },
)

watch(
  localSettings,
  value => {
    if (isSyncingFromStore.value) return
    isSyncingFromLocal.value = true
    settings.value = cloneSettings(value)
    isSyncingFromLocal.value = false
  },
  { deep: true },
)

const handleReset = () => {
  resetSettings()
}
</script>

<template>
  <div>
    <UButton
      class="fixed top-4 left-4 z-50"
      color="neutral"
      variant="outline"
      :label="isOpen ? 'Close Settings' : 'Open Settings'"
      @click="isOpen = !isOpen"
    />

    <div
      v-if="isOpen"
      class="fixed top-16 left-4 w-80 z-50 bg-white rounded-xl shadow-lg border p-4 space-y-4 max-h-[80vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-base font-semibold">Skill Tree Settings</h3>
        <UButton
          label="Reset"
          color="error"
          variant="outline"
          @click="handleReset"
        />
      </div>

      <section>
        <h4 class="text-xs uppercase tracking-wide text-gray-500 mb-2">
          Viewport
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Width
            <input
              v-model.number="localSettings.viewport.width"
              type="number"
              min="400"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Height
            <input
              v-model.number="localSettings.viewport.height"
              type="number"
              min="300"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
        </div>
      </section>

      <section>
        <h4 class="text-xs uppercase tracking-wide text-gray-500 mb-2">
          Layout
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Vertical Gap
            <input
              v-model.number="localSettings.layout.verticalGap"
              type="number"
              min="40"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Horizontal Gap
            <input
              v-model.number="localSettings.layout.horizontalGap"
              type="number"
              min="40"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
        </div>
      </section>

      <section>
        <h4 class="text-xs uppercase tracking-wide text-gray-500 mb-2">
          Node Size
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Min Width
            <input
              v-model.number="localSettings.node.minWidth"
              type="number"
              min="40"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Min Height
            <input
              v-model.number="localSettings.node.minHeight"
              type="number"
              min="24"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Horizontal Padding
            <input
              v-model.number="localSettings.node.horizontalPadding"
              type="number"
              min="0"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
          <label class="text-xs font-medium text-gray-600 flex flex-col gap-1">
            Vertical Padding
            <input
              v-model.number="localSettings.node.verticalPadding"
              type="number"
              min="0"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
          <label
            class="text-xs font-medium text-gray-600 flex flex-col gap-1 col-span-2"
          >
            Font Size (px)
            <input
              v-model.number="localSettings.node.fontSize"
              type="number"
              min="10"
              class="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring"
            />
          </label>
        </div>
      </section>
    </div>
  </div>
</template>
