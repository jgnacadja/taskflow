<template>
  <div class="flex min-h-screen">
    <LeftSidebar />
    <main class="flex min-w-0 flex-1 flex-col px-12 py-10">
      <div v-if="selectedList" class="flex flex-row gap-2 justify-between">
        <div>
          <h1 class="mb-3 font-display text-2xl font-bold text-ink">{{ selectedList.name }}</h1>
          <p class="text-sm text-ink-muted">Les tâches de cette liste apparaîtront ici.</p>
        </div>
        <button
          class="h-10 cursor-pointer rounded-full bg-black px-5 font-sans text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Nouvelle tâche
        </button>
      </div>
      <p v-else class="flex flex-1 items-center justify-center text-center text-sm text-ink-muted">
        Sélectionnez ou créez une liste pour commencer.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useListsStore } from '~/stores/lists'

const listsStore = useListsStore()
const { selectedList } = storeToRefs(listsStore)

onMounted(async () => {
  await listsStore.fetchLists()
  if (!listsStore.selectedListId && listsStore.lists.length) {
    listsStore.selectList(listsStore.lists[0].id)
  }
})
</script>
