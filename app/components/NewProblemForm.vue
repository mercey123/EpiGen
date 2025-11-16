<script setup lang="ts">
const emit = defineEmits<{
  loadAllTrees: []
  decisionTrees: [DecisionTree]
}>()

const { createProblem } = useDecisionTree()
const toast = useToast()

const problemDescription = ref('')
const problemGoal = ref('')
const currentTag = ref('')
const tags = ref<string[]>([])
const isLoading = ref(false)

const addTag = () => {
  if (
    currentTag.value.trim() &&
    !tags.value.includes(currentTag.value.trim())
  ) {
    tags.value.push(currentTag.value.trim())
    currentTag.value = ''
  }
}

const removeTag = (tag: string) => {
  tags.value = tags.value.filter(t => t !== tag)
}

const handleCreateProblem = async () => {
  const title = problemDescription.value.trim()

  if (!title) {
    toast.add({
      title: 'Заполните название проблемы',
      color: 'warning',
    })
    return
  }

  isLoading.value = true

  try {
    const response = await createProblem({
      description: title,
      goal: problemGoal.value.trim() || undefined,
      tags: tags.value,
    })

    if (response.existingTreeId) {
      toast.add({
        title: 'Найдена похожая проблема',
        description: `Дерево: ${response.existingTreeId}`,
        color: 'warning',
      })
      emit('loadAllTrees')
    } else if (response.newTree) {
      emit('decisionTrees', response.newTree)
      problemDescription.value = ''
      problemGoal.value = ''
      tags.value = []
    }
  } catch (e: any) {
    toast.add({
      title: 'Не удалось создать проблему',
      description: e?.message || 'Попробуйте ещё раз позже',
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-4 bg-default border border-muted rounded-2xl shadow-lg px-6 py-8"
  >
    <div class="flex flex-col gap-2">
      <span class="text-sm"> What challenge are you facing? </span>

      <UTextarea
        v-model="problemDescription"
        autoresize
        :rows="8"
        color="neutral"
        variant="soft"
        placeholder="E.g., I'm struggling to save money each month and want to build an emergency fund..."
      />
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-sm"> End goal (optional) </span>

      <UTextarea
        v-model="problemGoal"
        autoresize
        :rows="2"
        color="neutral"
        variant="soft"
        placeholder="E.g., I want to build an emergency fund of $1,000 in 3 months..."
      />
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-sm"> Tags </span>
      <div class="flex gap-2">
        <UInput
          v-model="currentTag"
          placeholder="Add a tag"
          color="neutral"
          variant="subtle"
          @keyup.enter="addTag"
        />
        <UButton
          class="rounded-lg"
          color="secondary"
          variant="soft"
          @click="addTag"
          label="Add"
        />
      </div>

      <div v-if="tags.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="tag in tags"
          :key="tag"
          class="bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
        >
          <span class="flex ml-2 my-1 items-center">
            {{ tag }}
          </span>

          <UButton
            class="w-fit h-fit rounded-full"
            size="sm"
            color="error"
            variant="ghost"
            @click="removeTag(tag)"
            label="x"
          />
        </span>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <span class="text-sm text-muted">
        {{ problemDescription.length }}
        {{ `characters${problemDescription.length > 1 ? 's' : ''}` }}
      </span>

      <UButton
        size="lg"
        :ui="{
          base: 'px-4 py-2 bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-500 hover:opacity-75 disabled:opacity-50',
          leadingIcon: 'size-4',
        }"
        icon="i-lucide-star"
        :loading="isLoading"
        label="Generate Solution Map"
        @click="handleCreateProblem"
      />
    </div>
  </div>
</template>
