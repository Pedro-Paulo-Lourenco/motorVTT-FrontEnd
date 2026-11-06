import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { SheetFieldType } from '@motor-vtt/contracts';

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

export function newField(): BuilderField {
  return { id: '', label: '', type: SheetFieldType.TEXT, formula: null, required: false, attributeId: null };
}

export function validateFormula(formula: string): string | null {
  const value = formula.trim();
  if (!value) return null;
  let depth = 0;
  let previous: 'value' | 'operator' | 'open' | 'close' | 'comma' | null = null;
  const tokenPattern = /\s+|@([A-Za-z_][A-Za-z0-9_]*)|([A-Za-z_][A-Za-z0-9_]*)|(\d+(?:\.\d+)?)|([+\-*/])|(\()|(\))|(,)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(value))) {
    if (match.index !== cursor) return 'A fórmula contém um caractere inválido.';
    cursor = tokenPattern.lastIndex;
    if (match[1] || match[2] || match[3]) {
      const identifier = match[1] || match[2];
      if (identifier && !match[1] && !['floor', 'ceil', 'min', 'max'].includes(identifier)) return `Identificador inválido: ${identifier}.`;
      previous = 'value';
    } else if (match[4]) {
      if (previous === 'value' || previous === 'close') return 'Operador em posição inválida.';
      previous = 'operator';
    } else if (match[5]) {
      depth += 1;
      previous = 'open';
    } else if (match[6]) {
      if (depth-- <= 0 || previous === 'operator' || previous === 'open' || previous === 'comma') return 'Parênteses inválidos.';
      previous = 'close';
    } else if (match[7]) {
      if (previous !== 'value' && previous !== 'close') return 'Vírgula em posição inválida.';
      previous = 'comma';
    }
  }
  if (cursor !== value.length || depth !== 0 || previous === 'operator' || previous === 'open' || previous === 'comma') return 'Fórmula incompleta ou com parênteses inválidos.';
  return null;
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
  function reset(): void { nome.value = ''; sistema.value = ''; camposSchema.value = emptySchema(); }
  function validate(): string | null {
    if (!nome.value.trim()) return 'Informe o nome do template.';
    const ids = new Set<string>();
    for (const section of Object.keys(camposSchema.value) as SheetSection[]) for (const field of camposSchema.value[section]) {
      if (!field.label.trim()) return 'Preencha o rótulo de todos os campos.';
      if (!field.id.trim()) return 'Preencha o ID de variável de todos os campos.';
      if (ids.has(field.id.trim())) return `O ID de variável "${field.id}" está duplicado.`;
      ids.add(field.id.trim());
      if (field.type === SheetFieldType.FORMULA && !field.formula?.trim()) return `Informe a fórmula de "${field.label}".`;
      if (field.formula) { const formulaError = validateFormula(field.formula); if (formulaError) return `Fórmula de "${field.label}": ${formulaError}`; }
    }
    return null;
  }
  return { nome, sistema, camposSchema, isSaving, totalFields, addField, updateField, removeField, reset, validate };
});
