<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import type { Socket } from 'socket.io-client';
import { useCharacterSheetStore } from '@/stores/characterSheetStore';
import SheetRenderer from './SheetRenderer.vue';
import type { SheetField } from '@motor-vtt/contracts';

const props = defineProps<{ open: boolean; sheetId: string | null; roomId?: string; socket?: Socket | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useCharacterSheetStore();
watch(() => [props.open, props.sheetId, props.socket, props.roomId] as const, ([open, sheetId, socket, roomId]) => {
  if (open && sheetId) void store.fetchSheet(sheetId, roomId ?? '', socket ?? undefined);
  if (!open) store.reset();
}, { immediate: true });
onBeforeUnmount(() => store.reset());

function updateValue(field: SheetField, value: unknown): void {
  if (field.type === 'RESOURCE' && typeof value === 'object' && value !== null) {
    store.updateResource(field.id, value as { atual: number; maximo: number });
    return;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) store.updateFieldValue(field.id, value);
}
</script>

<template>
  <Transition name="sheet-fade"><button v-if="open" class="sheet-backdrop" type="button" aria-label="Fechar ficha" @click="emit('close')" /></Transition>
  <Transition name="sheet-slide">
    <aside v-if="open" class="sheet-drawer" aria-labelledby="sheet-title">
      <header class="drawer-header">
        <div><p class="sheet-kicker">Ficha de personagem</p><h2 id="sheet-title">{{ store.sheet?.nome ?? 'Ficha' }}</h2></div>
        <button type="button" class="drawer-close" aria-label="Fechar ficha" @click="emit('close')">×</button>
      </header>
      <div v-if="store.isLoading" class="drawer-state">Carregando ficha...</div>
      <div v-else-if="store.error" class="drawer-state error" role="alert">{{ store.error }}</div>
      <template v-else-if="store.template">
<div class="drawer-content"><SheetRenderer :schema="store.template.camposSchema" :values="store.values" mode="play" @update:value="updateValue" /></div>
      </template>
    </aside>
  </Transition>
</template>

<style scoped>
.sheet-backdrop{position:fixed;inset:0;z-index:14;border:0;background:rgb(0 0 0 / 35%);cursor:pointer}.sheet-drawer{position:fixed;inset:0 0 0 auto;z-index:15;display:flex;width:min(94vw,28rem);flex-direction:column;background:#17231d;color:#f8f1df;box-shadow:-1rem 0 2rem rgb(0 0 0 / 25%)}.drawer-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem;border-bottom:1px solid rgb(255 255 255 / 12%)}.sheet-kicker{margin:0;color:#d4a967;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}.drawer-header h2{margin:.25rem 0 0}.drawer-close{border:0;color:inherit;background:transparent;font-size:1.75rem;cursor:pointer}.sheet-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:.25rem;padding:.7rem 1rem 0}.sheet-tabs button{min-height:2.4rem;border:0;border-bottom:2px solid transparent;color:#b9b4a8;background:transparent;font-size:.72rem;cursor:pointer}.sheet-tabs button.active{border-color:#d4a967;color:#f8f1df}.drawer-content{display:grid;align-content:start;gap:1rem;overflow:auto;padding:1rem 1.25rem 2rem}.sheet-field{display:grid;gap:.35rem}.sheet-field>span,.resource-label span{font-size:.88rem;color:#d8d1c2}.sheet-field input{width:100%;box-sizing:border-box;padding:.55rem .65rem;border:1px solid rgb(255 255 255 / 18%);border-radius:.4rem;color:inherit;background:#24332a;font:inherit}.resource-field{gap:.65rem}.resource-label,.resource-controls,.formula-field{display:flex;align-items:center;justify-content:space-between;gap:.7rem}.resource-label strong{color:#eabf79}.resource-track{height:.5rem;overflow:hidden;border-radius:99px;background:#3b4b40}.resource-track span{display:block;height:100%;border-radius:inherit;background:#d4a967;transition:width .2s ease}.resource-controls{align-items:end}.resource-controls label{display:grid;flex:1;gap:.25rem;font-size:.72rem;color:#b9b4a8}.resource-controls button{width:2rem;height:2rem;border:1px solid rgb(255 255 255 / 18%);border-radius:.4rem;color:inherit;background:#24332a;font-size:1.15rem;cursor:pointer}.resource-controls input{width:100%;box-sizing:border-box;padding:.4rem;border:1px solid rgb(255 255 255 / 18%);border-radius:.35rem;color:inherit;background:#24332a}.formula-field{padding:.7rem;border:1px solid rgb(255 255 255 / 12%);border-radius:.45rem;background:#24332a}.formula-field div{display:grid;gap:.15rem}.formula-field small{color:#aaa394;font-size:.7rem}.formula-field strong{color:#eabf79;font-size:1.35rem}.drawer-state,.empty-section{padding:1.25rem}.drawer-state.error{color:#ffb4ab}.sheet-fade-enter-active,.sheet-fade-leave-active{transition:opacity .2s ease}.sheet-fade-enter-from,.sheet-fade-leave-to{opacity:0}.sheet-slide-enter-active,.sheet-slide-leave-active{transition:transform .25s ease}.sheet-slide-enter-from,.sheet-slide-leave-to{transform:translateX(100%)}
</style>
<style scoped>
.sheet-backdrop { z-index: 110; }
.sheet-drawer { z-index: 111; }
</style>
