<script setup lang="ts">
import { computed, ref } from 'vue';
import { evaluateFormulaFields, SheetFieldType, type SheetField, type SheetFieldsSchema } from '@motor-vtt/contracts';

type SheetSection = keyof SheetFieldsSchema;
type ResourceValue = { atual: number; maximo: number };
type SheetValue = string | number | boolean | ResourceValue | null | undefined;

const props = defineProps<{
  schema: SheetFieldsSchema;
  values?: Record<string, SheetValue>;
  mode: 'play' | 'edit_template' | 'view';
}>();
const emit = defineEmits<{
  'update:value': [field: SheetField, value: SheetValue];
  'edit-field': [section: SheetSection, index: number];
  'add-field': [section: SheetSection];
  'move-field': [section: SheetSection, index: number, direction: -1 | 1];
  'remove-field': [section: SheetSection, index: number];
  'roll-field': [field: SheetField];
}>();
const sections: Array<{ key: SheetSection; label: string }> = [
  { key: 'cabecalho', label: 'Cabeçalho' }, { key: 'atributos', label: 'Atributos' },
  { key: 'recursos', label: 'Recursos' }, { key: 'pericias', label: 'Perícias' },
];
const activeSection = ref<SheetSection>('cabecalho');
const lastRolls = ref<Record<string, number>>({});
const activeFields = computed(() => props.schema[activeSection.value] ?? []);
const isEditing = computed(() => props.mode === 'edit_template');
const isInteractive = computed(() => props.mode === 'play');
function valueFor(field: SheetField): SheetValue {
  if (!field.formula) return props.values?.[field.id];
  try {
    const fields = Object.values(props.schema).flat();
    const value = evaluateFormulaFields(fields, props.values ?? {})[field.id];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}
function resourceFor(field: SheetField): ResourceValue {
  const value = valueFor(field);
  return typeof value === 'object' && value !== null && 'atual' in value && 'maximo' in value ? value : { atual: 0, maximo: 0 };
}
function updateValue(field: SheetField, value: SheetValue): void { emit('update:value', field, value); }
function updateText(field: SheetField, event: Event): void {
  const input = event.target as HTMLInputElement;
  updateValue(field, field.type === SheetFieldType.NUMBER ? Number(input.value) : field.type === SheetFieldType.BOOLEAN ? input.checked : input.value);
}
function updateResourceInput(field: SheetField, event: Event, key: 'atual' | 'maximo'): void {
  const value = Number((event.target as HTMLInputElement).value);
  const current = resourceFor(field);
  if (!Number.isFinite(value)) return;
  const maximo = key === 'maximo' ? Math.max(1, value) : current.maximo;
  updateValue(field, { atual: Math.max(0, Math.min(key === 'maximo' ? current.atual : value, maximo)), maximo });
}
function updateResource(field: SheetField, next: ResourceValue): void { updateValue(field, next); }
function roll(field: SheetField): void {
  lastRolls.value = { ...lastRolls.value, [field.id]: Math.floor(Math.random() * 20) + 1 };
  emit('roll-field', field);
}
function percentage(value: ResourceValue): number { return value.maximo > 0 ? Math.max(0, Math.min(100, (value.atual / value.maximo) * 100)) : 0; }
</script>

<template>
  <div class="sheet-renderer" :class="`sheet-mode-${mode}`">
    <nav class="sheet-tabs" aria-label="Seções da ficha">
      <button v-for="section in sections" :key="section.key" type="button" :class="{ active: activeSection === section.key }" :aria-selected="activeSection === section.key" @click="activeSection = section.key">{{ section.label }}</button>
    </nav>
    <section class="sheet-content" :aria-label="sections.find((section) => section.key === activeSection)?.label">
      <p v-if="activeFields.length === 0" class="empty-section">Nenhum campo nesta seção.</p>
      <div v-for="(field, index) in activeFields" :key="`${field.id}-${index}`" class="sheet-field-wrapper">
        <div v-if="isEditing" class="field-editor-toolbar" aria-label="Controles do campo">
          <button type="button" title="Editar campo" aria-label="Editar campo" @click="emit('edit-field', activeSection, index)">⚙️</button>
          <button type="button" title="Mover para cima" aria-label="Mover para cima" :disabled="index === 0" @click="emit('move-field', activeSection, index, -1)">⬆️</button>
          <button type="button" title="Mover para baixo" aria-label="Mover para baixo" :disabled="index === activeFields.length - 1" @click="emit('move-field', activeSection, index, 1)">⬇️</button>
          <button type="button" title="Excluir campo" aria-label="Excluir campo" @click="emit('remove-field', activeSection, index)">🗑️</button>
        </div>
        <div v-if="field.formula" class="formula-field"><div><span>{{ field.label }}</span><small>{{ field.formula }}</small></div><strong>{{ Number(valueFor(field) ?? 0) }}</strong></div>
        <div v-else-if="field.type === SheetFieldType.RESOURCE" class="sheet-field resource-field">
          <div class="resource-label"><span>{{ field.label }}</span><strong>{{ resourceFor(field).atual }} / {{ resourceFor(field).maximo }}</strong></div>
          <div class="resource-track" role="progressbar" :aria-label="field.label" :aria-valuenow="resourceFor(field).atual" aria-valuemin="0" :aria-valuemax="resourceFor(field).maximo"><span :style="{ width: `${percentage(resourceFor(field))}%` }" /></div>
          <div v-if="isInteractive || isEditing" class="resource-controls">
            <button type="button" aria-label="Diminuir recurso" :disabled="isEditing" @click="updateResource(field, { ...resourceFor(field), atual: Math.max(0, resourceFor(field).atual - 1) })">−</button>
            <label>Atual<input :disabled="isEditing" type="number" min="0" :max="resourceFor(field).maximo" :value="resourceFor(field).atual" @input="updateResourceInput(field, $event, 'atual')"></label>
            <button type="button" aria-label="Aumentar recurso" :disabled="isEditing" @click="updateResource(field, { ...resourceFor(field), atual: Math.min(resourceFor(field).maximo, resourceFor(field).atual + 1) })">+</button>
            <label>Máximo<input :disabled="isEditing" type="number" min="1" :value="resourceFor(field).maximo" @input="updateResourceInput(field, $event, 'maximo')"></label>
          </div>
        </div>
        <label v-else class="sheet-field"><span>{{ field.label }}</span><input :type="field.type === SheetFieldType.NUMBER ? 'number' : field.type === SheetFieldType.BOOLEAN ? 'checkbox' : 'text'" :value="valueFor(field) ?? ''" :checked="field.type === SheetFieldType.BOOLEAN && valueFor(field) === true" :disabled="!isInteractive" @input="updateText(field, $event)"></label>
        <div v-if="mode !== 'view' && field.type !== SheetFieldType.RESOURCE && !field.formula" class="field-actions"><button type="button" :disabled="isEditing" @click="roll(field)">🎲 Rolar</button><output v-if="lastRolls[field.id] !== undefined">{{ lastRolls[field.id] }}</output></div>
      </div>
      <button v-if="isEditing" type="button" class="add-field-button" @click="emit('add-field', activeSection)">+ Adicionar Campo</button>
    </section>
  </div>
</template>

<style scoped>
.sheet-renderer{display:grid;gap:1rem;color:inherit}.sheet-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:.25rem}.sheet-tabs button{min-height:2.4rem;border:0;border-bottom:2px solid transparent;color:inherit;background:transparent;opacity:.65;font:inherit;font-size:.78rem;cursor:pointer}.sheet-tabs button.active{border-color:#d4a967;opacity:1}.sheet-content{display:grid;align-content:start;gap:1rem}.sheet-field-wrapper{position:relative;display:grid;gap:.45rem}.field-editor-toolbar{display:flex;justify-content:flex-end;gap:.25rem}.field-editor-toolbar button,.field-actions button{border:1px solid currentColor;border-radius:.35rem;padding:.25rem .45rem;color:inherit;background:transparent;font:inherit;cursor:pointer}.field-editor-toolbar button:disabled{cursor:not-allowed;opacity:.35}.sheet-field{display:grid;gap:.35rem}.sheet-field>span,.resource-label span{font-size:.88rem;opacity:.8}.sheet-field input{width:100%;box-sizing:border-box;padding:.55rem .65rem;border:1px solid currentColor;border-radius:.4rem;color:inherit;background:transparent;font:inherit}.sheet-field input[type=checkbox]{width:1.1rem}.resource-field{gap:.65rem}.resource-label,.resource-controls,.formula-field,.field-actions{display:flex;align-items:center;justify-content:space-between;gap:.7rem}.resource-label strong,.formula-field strong{color:#d4a967}.resource-track{height:.5rem;overflow:hidden;border-radius:99px;background:rgb(128 128 128 / 30%)}.resource-track span{display:block;height:100%;border-radius:inherit;background:#d4a967;transition:width .2s ease}.resource-controls{align-items:end}.resource-controls label{display:grid;flex:1;gap:.25rem;font-size:.72rem;opacity:.75}.resource-controls button{width:2rem;height:2rem;border:1px solid currentColor;border-radius:.4rem;color:inherit;background:transparent;font-size:1.15rem;cursor:pointer}.resource-controls input{width:100%;box-sizing:border-box;padding:.4rem;border:1px solid currentColor;border-radius:.35rem;color:inherit;background:transparent}.formula-field{padding:.7rem;border:1px solid currentColor;border-radius:.45rem}.formula-field div{display:grid;gap:.15rem}.formula-field small{opacity:.65;font-size:.7rem}.formula-field strong{font-size:1.35rem}.field-actions{justify-content:flex-end}.field-actions output{min-width:1.5rem;color:#d4a967;font-weight:700;text-align:center}.add-field-button{min-height:2.5rem;border:1px dashed currentColor;border-radius:.45rem;color:inherit;background:transparent;font:inherit;cursor:pointer}.empty-section{margin:0;padding:1.25rem 0;opacity:.7}
</style>
