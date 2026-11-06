<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import type { Socket } from 'socket.io-client';
import { SheetFieldType } from '@motor-vtt/contracts';
import { useCharacterSheetStore } from '@/stores/characterSheetStore';
import AttributeInput from './AttributeInput.vue';
import ResourceBarInput from './ResourceBarInput.vue';
import FormulaDisplay from './FormulaDisplay.vue';

const props = defineProps<{ open: boolean; sheetId: string | null; roomId: string; socket: Socket | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useCharacterSheetStore();
const visibleFields = computed(() => store.fields.filter((field) => !field.formula));
const groupedFields = computed(() => ({
  cabecalho: visibleFields.value.filter((field) => store.template?.camposSchema.cabecalho.some((entry) => entry.id === field.id)),
  atributos: visibleFields.value.filter((field) => store.template?.camposSchema.atributos.some((entry) => entry.id === field.id)),
  recursos: visibleFields.value.filter((field) => store.template?.camposSchema.recursos.some((entry) => entry.id === field.id)),
  pericias: store.formulaFields,
}));

watch(() => [props.open, props.sheetId, props.socket] as const, ([open, nextSheetId, nextSocket]) => {
  if (open && nextSheetId && nextSocket) void store.load(nextSheetId, props.roomId, nextSocket);
  if (!open) store.reset();
}, { immediate: true });

onBeforeUnmount(() => store.reset());
function numberValue(id: string): number { return typeof store.values[id] === 'number' ? store.values[id] as number : 0; }
function resourceValue(id: string): { atual: number; maximo: number } { const value = store.values[id]; return typeof value === 'object' && value !== null ? value : { atual: 0, maximo: 0 }; }
</script>
<template>
  <aside class="sheet-drawer" :class="{ 'is-open': open }" :aria-hidden="!open">
    <div class="drawer-header"><div><p class="sheet-kicker">Ficha de personagem</p><h2>{{ store.sheet?.nome ?? 'Ficha' }}</h2></div><button type="button" class="drawer-close" aria-label="Fechar ficha" @click="emit('close')">×</button></div>
    <div v-if="store.isLoading" class="drawer-state">Carregando ficha...</div>
    <div v-else-if="store.error" class="drawer-state error" role="alert">{{ store.error }}</div>
    <div v-else-if="store.template" class="drawer-content">
      <section v-if="groupedFields.cabecalho.length" class="sheet-section"><h3>Cabeçalho</h3><div v-for="field in groupedFields.cabecalho" :key="field.id" class="sheet-field"><span>{{ field.label }}</span><output>{{ store.fieldValue(field) ?? '—' }}</output></div></section>
      <section v-if="groupedFields.atributos.length" class="sheet-section"><h3>Atributos</h3><AttributeInput v-for="field in groupedFields.atributos" :key="field.id" :label="field.label" :model-value="numberValue(field.id)" @update:model-value="store.updateAttribute(field.id, $event)" /></section>
      <section v-if="groupedFields.recursos.length" class="sheet-section"><h3>Recursos</h3><ResourceBarInput v-for="field in groupedFields.recursos" :key="field.id" :label="field.label" :model-value="resourceValue(field.id)" @update:model-value="store.updateResource(field.id, $event)" /></section>
      <section v-if="groupedFields.pericias.length" class="sheet-section"><h3>Perícias e fórmulas</h3><FormulaDisplay v-for="field in groupedFields.pericias" :key="field.id" :label="field.label" :formula="field.formula" :value="Number(store.fieldValue(field) ?? 0)" /></section>
    </div>
  </aside>
</template>
<style scoped>
.sheet-drawer{position:fixed;z-index:15;top:0;right:0;display:flex;width:min(92vw,25rem);height:100vh;flex-direction:column;background:#17231d;color:#f8f1df;box-shadow:-1rem 0 2rem rgb(0 0 0 / 25%);transform:translateX(100%);transition:transform .25s ease}.sheet-drawer.is-open{transform:translateX(0)}.drawer-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem;border-bottom:1px solid rgb(255 255 255 / 12%)}.sheet-kicker{margin:0;color:#d4a967;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase}.drawer-header h2{margin:.25rem 0 0}.drawer-close{border:0;color:inherit;background:transparent;font-size:1.75rem;cursor:pointer}.drawer-content{display:grid;gap:1.25rem;overflow:auto;padding:1.25rem}.sheet-section{display:grid;gap:.7rem}.sheet-section h3{margin:0;color:#d4a967;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}.sheet-field{display:grid;gap:.3rem}.sheet-field>span,.resource-label span{font-size:.88rem;color:#d8d1c2}.sheet-field input{width:100%;padding:.55rem .65rem;border:1px solid rgb(255 255 255 / 18%);border-radius:.4rem;color:inherit;background:#24332a;font:inherit}.resource-label,.resource-values,.formula-field{display:flex;align-items:center;justify-content:space-between;gap:.7rem}.resource-range{accent-color:#d4a967!important}.resource-values{align-items:flex-end}.resource-values label{display:grid;flex:1;gap:.25rem;font-size:.75rem;color:#b9b4a8}.formula-field{padding:.7rem;border:1px solid rgb(255 255 255 / 12%);border-radius:.45rem;background:#24332a}.formula-field div{display:grid;gap:.15rem}.formula-field small{color:#aaa394;font-size:.7rem}.formula-field strong{color:#eabf79;font-size:1.35rem}.drawer-state{padding:1.25rem}.drawer-state.error{color:#ffb4ab}
</style>
