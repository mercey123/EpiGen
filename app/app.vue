<template>
  <UApp>
    <UHeader :toggle="false">
      <template #left>
        <NuxtLink to="/" class="font-bold text-xl"> EpiGen </NuxtLink>
      </template>
      <template #right>
        <UButton to="/" variant="ghost" color="neutral"> Главная </UButton>
        <UButton to="/search" variant="ghost" color="neutral"> Поиск </UButton>
      </template>
    </UHeader>
    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
