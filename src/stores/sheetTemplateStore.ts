import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { detectCircularDependencies, SheetFieldType, validateFormula as parseFormula } from '@motor-vtt/contracts';

export type SheetSection = 'cabecalho' | 'atributos' | 'recursos' | 'pericias';
export type BuilderFieldType = SheetFieldType;

export interface BuilderField {
  id: string;
  label: string;
  type: BuilderFieldType;
  formula: string | null;
  required: boolean;
  attributeId: string | null;
}

export interface SheetTemplateDraft {
  nome: string;
  sistema: string;
  camposSchema: Record<SheetSection, BuilderField[]>;
}

export const sectionLabels: Record<SheetSection, string> = {
  cabecalho: 'Cabeçalho',
  atributos: 'Atributos',
  recursos: 'Recursos',
  pericias: 'Perícias',
};

function emptySchema(): Record<SheetSection, BuilderField[]> {
  return { cabecalho: [], atributos: [], recursos: [], pericias: [] };
}

export const defaultTemplatePreset: Record<SheetSection, BuilderField[]> = {
  cabecalho: [],
  atributos: [
    { id: 'forca', label: 'Força', type: SheetFieldType.NUMBER, formula: null, required: true, attributeId: null },
    { id: 'destreza', label: 'Destreza', type: SheetFieldType.NUMBER, formula: null, required: true, attributeId: null },
    { id: 'constituicao', label: 'Constituição', type: SheetFieldType.NUMBER, formula: null, required: true, attributeId: null },
    { id: 'inteligencia', label: 'Inteligência', type: SheetFieldType.NUMBER, formula: null, required: true, attributeId: null },
    { id: 'sabedoria', label: 'Sabedoria', type: SheetFieldType.NUMBER, formula: null, required: true, attributeId: null },
    { id: 'carisma', label: 'Carisma', type: SheetFieldType.NUMBER, formula: null, required: true, attributeId: null },
  ],
  recursos: [
    { id: 'vida', label: 'Vida', type: SheetFieldType.RESOURCE, formula: null, required: true, attributeId: null },
    { id: 'mana', label: 'Mana', type: SheetFieldType.RESOURCE, formula: null, required: true, attributeId: null },
  ],
  pericias: [
    { id: 'atletismo', label: 'Atletismo', type: SheetFieldType.FORMULA, formula: '@forca + 2', required: false, attributeId: 'forca' },
    { id: 'furtividade', label: 'Furtividade', type: SheetFieldType.FORMULA, formula: '@destreza + 2', required: false, attributeId: 'destreza' },
    { id: 'resistencia', label: 'Resistência', type: SheetFieldType.FORMULA, formula: 'floor((@forca + @constituicao) / 2)', required: false, attributeId: 'constituicao' },
    { id: 'percepcao', label: 'Percepção', type: SheetFieldType.FORMULA, formula: 'max(@sabedoria, @inteligencia) + 1', required: false, attributeId: 'sabedoria' },
  ],
};

function cloneSchema(schema: Record<SheetSection, BuilderField[]>): Record<SheetSection, BuilderField[]> {
  return Object.fromEntries(Object.entries(schema).map(([section, fields]) => [section, fields.map((field) => ({ ...field }))])) as Record<SheetSection, BuilderField[]>;
}

export function newField(): BuilderField {
  return { id: '', label: '', type: SheetFieldType.TEXT, formula: null, required: false, attributeId: null };
}

export function validateFormula(formula: string): string | null {
  const value = formula.trim();
  if (!value) return null;
  const result = parseFormula(value);
  return result.valid ? null : result.error?.message ?? 'Fórmula inválida.';
}

export const useSheetTemplateStore = defineStore('sheetTemplate', () => {
  const nome = ref('');
  const sistema = ref('');
  const camposSchema = ref<Record<SheetSection, BuilderField[]>>(emptySchema());
  const isSaving = ref(false);
  const totalFields = computed(() => Object.values(camposSchema.value).reduce((total, fields) => total + fields.length, 0));
  function addField(section: SheetSection, field = newField()): void { camposSchema.value[section].push(field); }
  function updateField(section: SheetSection, index: number, field: BuilderField): void { camposSchema.value[section][index] = field; }
  function removeField(section: SheetSection, index: number): void { camposSchema.value[section].splice(index, 1); }
  function moveField(section: SheetSection, index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    const fields = camposSchema.value[section];
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const [field] = fields.splice(index, 1);
    if (field) fields.splice(nextIndex, 0, field);
  }
  function reset(preset: Record<SheetSection, BuilderField[]> | null = null): void {
    nome.value = '';
    sistema.value = '';
    camposSchema.value = cloneSchema(preset ?? emptySchema());
  }
  function validate(): string | null {
    if (!nome.value.trim()) return 'Informe o nome do template.';
    const ids = new Set<string>();
    for (const section of Object.keys(camposSchema.value) as SheetSection[]) for (const field of camposSchema.value[section]) {
      if (!field.label.trim()) return 'Preencha o rótulo de todos os campos.';
      if (!field.id.trim()) return 'Preencha o ID de variável de todos os campos.';
      if (ids.has(field.id.trim())) return `O ID de variável "${field.id}" está duplicado.`;
      ids.add(field.id.trim());
      if (field.type === SheetFieldType.FORMULA && !field.formula?.trim()) return `Informe a fórmula de "${field.label}".`;
    }
    for (const field of Object.values(camposSchema.value).flat()) {
      if (!field.formula) continue;
      const formulaError = parseFormula(field.formula, ids);
      if (!formulaError.valid) return `Fórmula de "${field.label}": ${formulaError.error?.message ?? 'expressão inválida.'}`;
    }
    const allFields = Object.values(camposSchema.value).flat();
    if (detectCircularDependencies(allFields)) return 'As fórmulas possuem uma dependência circular.';
    return null;
  }
  return { nome, sistema, camposSchema, isSaving, totalFields, addField, updateField, removeField, moveField, reset, validate };
});
