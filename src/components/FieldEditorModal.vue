<script setup lang="ts">
import { ref, watch } from 'vue';
import { SheetFieldType } from '@motor-vtt/contracts';
import { newField, validateFormula, type BuilderField } from '@/stores/sheetTemplateStore';
const props = defineProps<{ modelValue: boolean; field: BuilderField | null }>();
const emit = defineEmits<{ save: [field: BuilderField]; close: [] }>();
const draft = ref<BuilderField | null>(null);
const error = ref('');
watch(() => [props.modelValue, props.field] as const, () => { draft.value = props.modelValue ? (props.field ? { ...props.field } : newField()) : null; error.value = ''; }, { immediate: true });
function save(): void {
  if (!draft.value) return;
  if (!draft.value.label.trim() || !draft.value.id.trim()) { error.value = 'Rótulo e ID de variável são obrigatórios.'; return; }
  if (draft.value.formula) { const formulaError = validateFormula(draft.value.formula); if (formulaError) { error.value = formulaError; return; } }
  emit('save', { ...draft.value, label: draft.value.label.trim(), id: draft.value.id.trim(), formula: draft.value.formula?.trim() || null });
}
</script>
<template>
  <div v-if="modelValue && draft" class="modal-backdrop" role="presentation" @click.self="emit('close')">
    <section class="field-modal" role="dialog" aria-modal="true" aria-labelledby="field-modal-title">
      <div class="modal-header"><h2 id="field-modal-title">Configurar campo</h2><button type="button" class="icon-button" aria-label="Fechar" @click="emit('close')">×</button></div>
      <div class="modal-fields">
        <label>Rótulo<input v-model="draft.label" maxlength="120" type="text" /></label>
        <label>ID de variável<input v-model="draft.id" maxlength="80" type="text" placeholder="ex.: forca" /></label>
        <label>Tipo<select v-model="draft.type"><option :value="SheetFieldType.TEXT">Texto / informação</option><option :value="SheetFieldType.NUMBER">Número</option><option :value="SheetFieldType.RESOURCE">Recurso (atual / máximo)</option><option :value="SheetFieldType.FORMULA">Fórmula</option><option :value="SheetFieldType.BOOLEAN">Booleano</option></select></label>
        <label v-if="draft.type === SheetFieldType.FORMULA || draft.formula">Fórmula<textarea v-model="draft.formula" rows="3" placeholder="floor((@forca - 10) / 2)" /></label>
        <label class="checkbox"><input v-model="draft.required" type="checkbox" /> Campo obrigatório</label>
        <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
      </div>
      <div class="modal-actions"><button type="button" class="secondary-button" @click="emit('close')">Cancelar</button><button type="button" @click="save">Salvar campo</button></div>
    </section>
  </div>
</template>
<style scoped>
.modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:1rem;background:rgb(15 23 42 / 55%)}.field-modal{width:min(100%,34rem);padding:1.5rem;border-radius:.75rem;background:var(--color-background);box-shadow:0 1rem 3rem rgb(0 0 0 / 25%)}.modal-header,.modal-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}.modal-fields{display:grid;gap:1rem;margin:1.25rem 0}.modal-fields label{display:grid;gap:.35rem;font-weight:600}.modal-fields input:not([type=checkbox]),.modal-fields select,.modal-fields textarea{width:100%;padding:.6rem .7rem;border:1px solid var(--color-border);border-radius:.4rem;color:inherit;background:var(--color-background);font:inherit}.checkbox{display:flex!important;align-items:center;font-weight:normal!important}.icon-button{min-width:2rem;padding:.2rem;border:0;background:transparent;font-size:1.5rem;cursor:pointer}.secondary-button{color:inherit;background:transparent}
</style>
