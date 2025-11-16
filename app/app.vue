<template>
  <UApp>
    <UHeader :toggle="false">
      <template #left>
        <NuxtLink to="/" class="font-bold text-xl"> EpiGen </NuxtLink>
      </template>
      <template #right>
        <UModal fullscreen>
          <template #body>
            <iframe
              src="https://chrome-try-53324901.figma.site/"
              class="w-full h-full border-0 rounded-lg"
              title="Mini game about your financial life"
            />
          </template>

          <UButton variant="soft" label="Mini game about your financial life" />
        </UModal>
        <SkillSettingsPanel />
      </template>
    </UHeader>
    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
