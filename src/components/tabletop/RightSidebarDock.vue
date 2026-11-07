<script setup lang="ts">
import { computed, ref } from 'vue';

export type DockTab = 'chat' | 'sheets' | 'tokens' | 'assets' | 'settings';

const props = defineProps<{
  canOpenSettings?: boolean;
}>();
const emit = defineEmits<{ openSettings: [] }>();

const activeTab = defineModel<DockTab | null>('activeTab', { default: null });
const isMaximized = ref(false);

const tabs = computed(() => [
  { id: 'chat' as const, label: 'Chat e rolagens', icon: '💬' },
  { id: 'sheets' as const, label: 'Fichas', icon: '📜' },
  { id: 'tokens' as const, label: 'Tokens', icon: '🎭' },
  { id: 'assets' as const, label: 'Assets', icon: '📦' },
  ...(props.canOpenSettings ? [{ id: 'settings' as const, label: 'Configurações', icon: '⚙️' }] : []),
]);

const activeLabel = computed(() => tabs.value.find((tab) => tab.id === activeTab.value)?.label ?? '');

function toggleTab(tab: DockTab): void {
  if (tab === 'settings') {
    emit('openSettings');
    activeTab.value = null;
    return;
  }
  activeTab.value = activeTab.value === tab ? null : tab;
}
</script>

<template>
  <aside class="dock" :class="{ 'dock--expanded': activeTab, 'dock--maximized': isMaximized }" aria-label="Ferramentas da mesa">
    <nav class="dock-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="dock-tab"
        :class="{ 'dock-tab--active': activeTab === tab.id }"
        :aria-label="tab.label"
        :aria-pressed="activeTab === tab.id"
        @click="toggleTab(tab.id)"
      >
        <span aria-hidden="true">{{ tab.icon }}</span>
        <span class="dock-tooltip">{{ tab.label }}</span>
      </button>
    </nav>

    <section v-if="activeTab" class="dock-panel" role="dialog" :aria-label="activeLabel">
      <header class="dock-panel__header">
        <h2>{{ activeLabel }}</h2>
        <div class="dock-panel__actions">
          <button type="button" :aria-label="isMaximized ? 'Restaurar painel' : 'Maximizar painel'" @click="isMaximized = !isMaximized">
            {{ isMaximized ? '↙' : '↗' }}
          </button>
          <button type="button" aria-label="Fechar painel" @click="activeTab = null">×</button>
        </div>
      </header>
      <div class="dock-panel__content"><slot :name="activeTab" /></div>
    </section>
  </aside>
</template>

<style scoped>
.dock{position:fixed;z-index:30;top:9.25rem;right:1rem;bottom:1rem;display:flex;align-items:flex-start;gap:.65rem;pointer-events:none}
.dock-tabs,.dock-panel{pointer-events:auto;border:1px solid rgb(255 255 255 / 14%);background:rgb(18 27 23 / 94%);box-shadow:0 1rem 3rem rgb(0 0 0 / 32%);backdrop-filter:blur(14px)}
.dock-tabs{display:grid;gap:.35rem;padding:.45rem;border-radius:.8rem}
.dock-tab{position:relative;display:grid;width:2.8rem;height:2.8rem;place-items:center;border:0;border-radius:.55rem;color:#f5ecd9;background:transparent;font-size:1.15rem;cursor:pointer}
.dock-tab:hover,.dock-tab--active{background:#526c55}
.dock-tooltip{position:absolute;right:calc(100% + .5rem);display:none;width:max-content;padding:.3rem .5rem;border-radius:.35rem;color:#fff;background:#18251d;font-size:.75rem}
.dock-tab:hover .dock-tooltip{display:block}
.dock-panel{display:flex;width:min(min(28rem, calc(100vw - 5rem)), 28rem);height:100%;flex-direction:column;border-radius:.8rem;overflow:hidden;color:#f4efdf}
.dock--maximized .dock-panel{width:min(52rem, calc(100vw - 5rem))}
.dock-panel__header{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.8rem 1rem;border-bottom:1px solid rgb(255 255 255 / 12%)}
.dock-panel__header h2{margin:0;font:700 1rem Georgia,serif}
.dock-panel__actions{display:flex;gap:.25rem}
.dock-panel__actions button{width:2rem;height:2rem;border:0;border-radius:.35rem;color:inherit;background:transparent;font-size:1.2rem;cursor:pointer}
.dock-panel__actions button:hover{background:rgb(255 255 255 / 12%)}
.dock-panel__content{min-height:0;overflow:auto;padding:.75rem}
:deep(.sidebar-card),:deep(.token-panel){border:0;border-radius:0;color:#f4efdf;background:transparent}
:deep(.chat-message-list){max-height:none}
@media (max-width:620px){.dock{top:8.75rem;right:.5rem;bottom:.5rem}.dock-panel{width:calc(100vw - 4.25rem)}}
</style>
