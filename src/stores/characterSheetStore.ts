import { computed, onScopeDispose, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import { z } from 'zod';
import { characterSheetSchema, sheetTemplateSchema, type SheetField, type SheetTemplate } from '@motor-vtt/contracts';
import type { Socket } from 'socket.io-client';
import api from '@/services/api';

type SheetValue = string | number | { atual: number; maximo: number } | null;
type SheetValues = Record<string, SheetValue>;
type SheetSocket = Socket;

const updatedPayloadSchema = z.object({
  sheetId: z.string().uuid(),
  salaId: z.string().uuid(),
  dadosPreenchidos: z.record(z.string(), z.unknown()),
  versao: z.number().int().nonnegative(),
});
const socketErrorSchema = z.object({ code: z.string(), message: z.string() });

function normalizeValue(value: unknown): SheetValue {
  if (typeof value === 'string' || typeof value === 'number' || value === null) return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.atual === 'number' && typeof record.maximo === 'number') {
      return { atual: record.atual, maximo: record.maximo };
    }
  }
  return null;
}

function normalizeValues(value: Record<string, unknown>): SheetValues {
  return Object.fromEntries(Object.entries(value).map(([id, fieldValue]) => [id, normalizeValue(fieldValue)]));
}

function numericValue(value: SheetValue | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) return value.atual;
  return 0;
}

function evaluateFormula(formula: string, values: SheetValues): number {
  const expression = formula.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, id: string) => String(numericValue(values[id])));
  if (!/^[\d\s.+\-*/(),A-Za-z_]+$/.test(expression)) return 0;
  const functions = { floor: Math.floor, ceil: Math.ceil, min: Math.min, max: Math.max };
  try {
    return Function('floor', 'ceil', 'min', 'max', `"use strict"; return (${expression});`)(functions.floor, functions.ceil, functions.min, functions.max) as number;
  } catch {
    return 0;
  }
}

export const useCharacterSheetStore = defineStore('characterSheet', () => {
  const sheetId = ref<string | null>(null);
  const roomId = ref<string | null>(null);
  const sheet = ref<ReturnType<typeof characterSheetSchema.parse> | null>(null);
  const template = ref<SheetTemplate | null>(null);
  const values = ref<SheetValues>({});
  const version = ref(0);
  const isLoading = ref(false);
  const error = ref('');
  const socket = shallowRef<SheetSocket | null>(null);
  let persistTimer: ReturnType<typeof setTimeout> | undefined;
  let persistRequest: Promise<void> | undefined;
  let persistQueued = false;
  const fields = computed<SheetField[]>(() => {
    if (!template.value) return [];
    return Object.values(template.value.camposSchema).flat();
  });
  const formulaFields = computed(() => fields.value.filter((field) => field.formula));

  function applyValues(nextValues: Record<string, unknown>, nextVersion?: number): void {
    values.value = normalizeValues(nextValues);
    if (nextVersion !== undefined) version.value = nextVersion;
  }

  async function persistValues(): Promise<void> {
    if (!sheetId.value) return;
    persistQueued = false;
    const valuesToPersist = { ...values.value };
    persistRequest = api.put(`/character-sheets/${encodeURIComponent(sheetId.value)}/values`, valuesToPersist)
      .then((response) => {
        const parsed = z.object({ success: z.literal(true), data: characterSheetSchema }).safeParse(response.data);
        if (!parsed.success) throw new Error('Resposta de atualização da ficha inválida.');
        if (parsed.data.data.id === sheetId.value) {
          sheet.value = parsed.data.data;
          applyValues(parsed.data.data.dadosPreenchidos, parsed.data.data.versao);
        }
      })
      .catch(() => {
        error.value = 'Não foi possível salvar as alterações da ficha.';
      })
      .finally(() => {
        persistRequest = undefined;
        if (persistQueued) void persistValues();
      });
    await persistRequest;
  }

  function schedulePersist(): void {
    persistQueued = true;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = undefined;
      if (!persistRequest) void persistValues();
    }, 350);
  }

  function onSheetUpdated(payload: unknown): void {
    const parsed = updatedPayloadSchema.safeParse(payload);
    if (!parsed.success || parsed.data.sheetId !== sheetId.value || parsed.data.salaId !== roomId.value) return;
    applyValues(parsed.data.dadosPreenchidos, parsed.data.versao);
  }

  function onSheetError(payload: unknown): void {
    const parsed = socketErrorSchema.safeParse(payload);
    error.value = parsed.success ? parsed.data.message : 'Não foi possível atualizar o recurso.';
  }

  function disconnectSocket(): void {
    socket.value?.off('sheet:updated', onSheetUpdated);
    socket.value?.off('sheet:error', onSheetError);
    socket.value = null;
  }

  function connectSocket(nextSocket: SheetSocket, nextRoomId: string): void {
    disconnectSocket();
    socket.value = nextSocket;
    roomId.value = nextRoomId;
    nextSocket.on('sheet:updated', onSheetUpdated);
    nextSocket.on('sheet:error', onSheetError);
  }

  async function load(nextSheetId: string, nextRoomId: string, nextSocket?: SheetSocket): Promise<void> {
    if (nextSocket) connectSocket(nextSocket, nextRoomId);
    sheetId.value = nextSheetId;
    roomId.value = nextRoomId;
    isLoading.value = true;
    error.value = '';
    try {
      const sheetResponse = await api.get(`/character-sheets/${encodeURIComponent(nextSheetId)}`);
      const parsedSheet = z.object({ success: z.literal(true), data: characterSheetSchema }).safeParse(sheetResponse.data);
      if (!parsedSheet.success) throw new Error('Resposta da ficha inválida.');
      sheet.value = parsedSheet.data.data;
      applyValues(parsedSheet.data.data.dadosPreenchidos, parsedSheet.data.data.versao);
      const templateResponse = await api.get(`/sheet-templates/${encodeURIComponent(parsedSheet.data.data.templateId)}`);
      const parsedTemplate = z.object({ success: z.literal(true), data: sheetTemplateSchema }).safeParse(templateResponse.data);
      if (!parsedTemplate.success) throw new Error('Resposta do template inválida.');
      template.value = parsedTemplate.data.data;
    } catch {
      error.value = 'Não foi possível carregar a ficha.';
    } finally {
      isLoading.value = false;
    }
  }

  function updateAttribute(fieldId: string, value: number): void {
    updateFieldValue(fieldId, value);
  }

  function updateFieldValue(fieldId: string, value: SheetValue): void {
    values.value = { ...values.value, [fieldId]: normalizeValue(value) };
    schedulePersist();
  }

  function updateResource(fieldId: string, value: { atual: number; maximo: number }): void {
    values.value = { ...values.value, [fieldId]: value };
    if (!socket.value || !sheetId.value || !roomId.value) {
      error.value = 'A ficha não está conectada à sala.';
      return;
    }
    socket.value.emit('sheet:update-resource', {
      sheetId: sheetId.value,
      salaId: roomId.value,
      fieldId,
      newValue: value.atual,
    });
  }

  function fieldValue(field: SheetField): SheetValue {
    if (field.formula) return evaluateFormula(field.formula, values.value);
    return values.value[field.id] ?? null;
  }

  function reset(): void {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = undefined;
    persistQueued = false;
    disconnectSocket();
    sheetId.value = null;
    roomId.value = null;
    sheet.value = null;
    template.value = null;
    values.value = {};
    version.value = 0;
    error.value = '';
  }

  onScopeDispose(() => {
    if (persistTimer) clearTimeout(persistTimer);
    disconnectSocket();
  });

  return {
    sheetId,
    roomId,
    sheet,
    template,
    values,
    version,
    currentSheet: sheet,
    templateSchema: computed(() => template.value?.camposSchema ?? null),
    dadosPreenchidos: values,
    fields,
    formulaFields,
    isLoading,
    error,
    load,
    fetchSheet: (nextSheetId: string, nextRoomId = roomId.value ?? '', nextSocket = socket.value ?? undefined) => load(nextSheetId, nextRoomId, nextSocket),
    connectSocket,
    updateFieldValue,
    updateAttribute,
    updateResource,
    fieldValue,
    reset,
  };
});
