<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { SheetFieldType, validateFormula as parseFormula } from '@motor-vtt/contracts';
import { newField, type BuilderField } from '@/stores/sheetTemplateStore';
type CalculationMode = 'fixed' | 'sum' | 'custom';
const props = defineProps<{ modelValue: boolean; field: BuilderField | null; availableVariables?: Array<{ id: string; label: string }> }>();
const emit = defineEmits<{ save: [field: BuilderField]; close: [] }>();
const draft = ref<BuilderField | null>(null);
const error = ref('');
const calculationMode = ref<CalculationMode>('custom');
const fixedValue = ref('0');
const selectedVariable = ref('');
const bonus = ref('0');
const formulaVariables = computed(() => props.availableVariables ?? []);
watch(() => [props.modelValue, props.field] as const, () => {
  draft.value = props.modelValue ? (props.field ? { ...props.field } : newField()) : null;
  const formula = props.field?.formula?.trim() ?? '';
  const sumMatch = formula.match(/^@([A-Za-z_][A-Za-z0-9_]*)\s*([+-])\s*(\d+(?:\.\d+)?)$/);
  calculationMode.value = sumMatch ? 'sum' : formula && /^\d+(?:\.\d+)?$/.test(formula) ? 'fixed' : 'custom';
  fixedValue.value = formula && calculationMode.value === 'fixed' ? formula : '0';
  selectedVariable.value = sumMatch?.[1] ?? formulaVariables.value[0]?.id ?? '';
  bonus.value = sumMatch ? `${sumMatch[2] === '-' ? '-' : ''}${sumMatch[3]}` : '0';
  error.value = '';
}, { immediate: true });
function insertVariable(id: string): void {
  if (!draft.value) return;
  draft.value.formula = `${draft.value.formula?.trim() ? `${draft.value.formula.trim()} ` : ''}@${id}`;
}
function save(): void {
  if (!draft.value) return;
  if (!draft.value.label.trim() || !draft.value.id.trim()) { error.value = 'Preencha o nome que aparecerá na ficha e o nome curto para fórmulas.'; return; }
  if (draft.value.type === SheetFieldType.FORMULA) {
    if (calculationMode.value === 'fixed') draft.value.formula = fixedValue.value;
    if (calculationMode.value === 'sum') draft.value.formula = `@${selectedVariable.value} ${Number(bonus.value) < 0 ? '-' : '+'} ${Math.abs(Number(bonus.value))}`;
  }
  if (draft.value.formula) {
    const formulaResult = parseFormula(draft.value.formula, (props.availableVariables ?? []).map((variable) => variable.id));
    if (!formulaResult.valid) { error.value = formulaResult.error?.message ?? 'Revise a fórmula informada.'; return; }
  }
  emit('save', { ...draft.value, label: draft.value.label.trim(), id: draft.value.id.trim(), formula: draft.value.formula?.trim() || null });
}
</script>
<template>
  <div v-if="modelValue && draft" class="modal-backdrop" role="presentation" @click.self="emit('close')">
    <section class="field-modal" role="dialog" aria-modal="true" aria-labelledby="field-modal-title">
      <div class="modal-header"><h2 id="field-modal-title">Configurar campo</h2><button type="button" class="icon-button" aria-label="Fechar" @click="emit('close')">×</button></div>
      <div class="modal-fields">
        <label>Nome do campo<input v-model="draft.label" maxlength="120" type="text" placeholder="Ex.: Bônus de ataque" /></label>
        <label>Nome curto para fórmulas <span class="help" title="Use este nome em outros cálculos, como @forca">ℹ️</span><input v-model="draft.id" maxlength="80" type="text" placeholder="Ex.: forca" /><small>Use <strong>@{{ draft.id || 'nome' }}</strong> em outros cálculos.</small></label>
        <label>O que este campo guarda? <span class="help" title="Escolha o tipo de informação que será preenchida na ficha">ℹ️</span><select v-model="draft.type"><option :value="SheetFieldType.TEXT">Texto / informação</option><option :value="SheetFieldType.NUMBER">Número</option><option :value="SheetFieldType.RESOURCE">Recurso (atual / máximo)</option><option :value="SheetFieldType.FORMULA">Valor calculado</option><option :value="SheetFieldType.BOOLEAN">Sim ou não</option></select></label>
        <div v-if="draft.type === SheetFieldType.FORMULA" class="calculation">
          <label>Como este valor é calculado? <span class="help" title="Escolha uma opção pronta ou escreva sua própria fórmula">ℹ️</span><select v-model="calculationMode"><option value="fixed">Valor fixo</option><option value="sum">Soma de atributo + bônus</option><option value="custom">Fórmula customizada</option></select></label>
          <label v-if="calculationMode === 'fixed'">Qual é o valor?<input v-model="fixedValue" type="number" step="any" /></label>
          <template v-else-if="calculationMode === 'sum'">
            <label>Atributo <span class="help" title="Escolha o atributo usado no cálculo">ℹ️</span><select v-model="selectedVariable"><option v-for="variable in formulaVariables" :key="variable.id" :value="variable.id">{{ variable.label }}</option></select></label>
            <label>Bônus (opcional)<input v-model="bonus" type="number" step="any" /></label>
          </template>
          <label v-else>Fórmula customizada <span class="help" title="Use números, operações e os atalhos abaixo. Exemplo: @forca + 2">ℹ️</span><textarea v-model="draft.formula" rows="3" placeholder="Ex.: floor((@forca + @constituicao) / 2)" /></label>
          <div class="variable-shortcuts"><span>Inserir atributo:</span><button v-for="variable in formulaVariables" :key="variable.id" type="button" class="shortcut" @click="insertVariable(variable.id)">+ {{ variable.label }}</button></div>
          <small class="formula-help">Operadores: +, -, *, /, parênteses e unários +/-. Funções: floor, ceil, min e max.</small>
        </div>
        <label class="checkbox"><input v-model="draft.required" type="checkbox" /> Campo obrigatório</label>
        <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
      </div>
      <div class="modal-actions"><button type="button" class="secondary-button" @click="emit('close')">Cancelar</button><button type="button" @click="save">Salvar campo</button></div>
    </section>
  </div>
</template>
<style scoped>
.modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;align-items:start;overflow-y:auto;padding:1rem;background:rgb(15 23 42 / 55%)}.field-modal{width:min(100%,34rem);max-height:calc(100dvh - 2rem);margin:auto;padding:1.5rem;overflow-y:auto;box-sizing:border-box;border-radius:.75rem;background:var(--color-background);box-shadow:0 1rem 3rem rgb(0 0 0 / 25%)}.modal-header,.modal-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}.modal-fields{display:grid;gap:1rem;margin:1.25rem 0}.modal-fields label{display:grid;gap:.35rem;font-weight:600}.modal-fields input:not([type=checkbox]),.modal-fields select,.modal-fields textarea{width:100%;padding:.6rem .7rem;border:1px solid var(--color-border);border-radius:.4rem;color:inherit;background:var(--color-background);font:inherit}.modal-fields small{font-weight:normal;opacity:.72}.help{cursor:help}.calculation{display:grid;gap:1rem;padding:1rem;border-radius:.5rem;background:color-mix(in srgb,var(--color-border) 20%,transparent)}.variable-shortcuts{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;font-size:.85rem}.shortcut{padding:.35rem .5rem;border:1px solid var(--color-border);border-radius:.35rem;color:inherit;background:transparent;font:inherit;cursor:pointer}.checkbox{display:flex!important;align-items:center;font-weight:normal!important}.icon-button{min-width:2rem;padding:.2rem;border:0;background:transparent;font-size:1.5rem;cursor:pointer}.secondary-button{color:inherit;background:transparent}
</style>
