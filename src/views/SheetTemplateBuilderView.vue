<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { type ApiSuccess, type SheetField, type SheetTemplate } from '@motor-vtt/contracts';
import SheetRenderer from '@/components/sheet/SheetRenderer.vue';
import FieldEditorModal from '@/components/FieldEditorModal.vue';
import { defaultTemplatePreset, useSheetTemplateStore, type BuilderField, type SheetSection } from '@/stores/sheetTemplateStore';
import api from '@/services/api';
const store = useSheetTemplateStore();
const route = useRoute();
const router = useRouter();
const isEditing = ref(false);
const modalOpen = ref(false); const editing = ref<{ section: SheetSection; index: number } | null>(null); const error = ref(''); const success = ref('');
function addField(section: SheetSection): void { editing.value = { section, index: -1 }; modalOpen.value = true; }
function editField(section: SheetSection, index: number): void { editing.value = { section, index }; modalOpen.value = true; }
function moveField(section: SheetSection, index: number, direction: -1 | 1): void { store.moveField(section, index, direction); }
function saveField(field: BuilderField): void { if (!editing.value) return; if (editing.value.index < 0) store.addField(editing.value.section, field); else store.updateField(editing.value.section, editing.value.index, field); closeModal(); }
function closeModal(): void { modalOpen.value = false; editing.value = null; }
async function loadTemplate(): Promise<void> {
  const id = route.params.id;
  if (typeof id !== 'string') return;
  try {
    const response = await api.get<ApiSuccess<SheetTemplate>>(`/sheet-templates/${encodeURIComponent(id)}`);
    const template = response.data.data;
    store.nome = template.nome; store.sistema = template.sistema ?? '';
    store.camposSchema = Object.fromEntries(Object.entries(template.camposSchema).map(([section, fields]) => [section, fields.map((field: SheetField) => ({ formula: null, required: false, attributeId: null, ...field }))])) as typeof store.camposSchema;
    isEditing.value = true;
  } catch { error.value = 'Não foi possível carregar o template para edição.'; }
}
async function saveTemplate(): Promise<void> {
  error.value = ''; success.value = ''; const validationError = store.validate(); if (validationError) { error.value = validationError; return; } store.isSaving = true;
  try { const payload = { nome: store.nome.trim(), sistema: store.sistema.trim() || null, camposSchema: store.camposSchema };
    const response = isEditing.value ? await api.put<ApiSuccess<SheetTemplate>>(`/sheet-templates/${encodeURIComponent(String(route.params.id))}`, payload) : await api.post<ApiSuccess<SheetTemplate>>('/sheet-templates', payload); success.value = `Template "${response.data.data.nome}" ${isEditing.value ? 'atualizado' : 'criado'} com sucesso.`; }
  catch (requestError) { error.value = axios.isAxiosError(requestError) && requestError.response?.status === 400 ? 'Os dados do template são inválidos. Revise os campos.' : 'Não foi possível salvar o template. Tente novamente.'; }
  finally { store.isSaving = false; }
}
onMounted(() => {
  if (typeof route.params.id === 'string') {
    store.reset();
    void loadTemplate();
  } else {
    store.reset(defaultTemplatePreset);
    store.nome = 'Minha ficha de aventura';
    store.sistema = 'Sistema personalizado';
  }
});
</script>
<template>
  <main class="template-builder"><header class="page-header"><div><h1>{{ isEditing ? 'Editar template' : 'Construtor de template' }}</h1><p>Monte uma ficha customizada para sua mesa.</p></div></header>
    <form class="template-form" :aria-busy="store.isSaving" @submit.prevent="saveTemplate">
      <div class="template-details"><label>Nome do template<input v-model="store.nome" maxlength="160" type="text" required placeholder="Ex.: Ficha de fantasia" /></label><label>Sistema (opcional)<input v-model="store.sistema" maxlength="80" type="text" placeholder="Ex.: D&amp;D 5e" /></label></div>
      <SheetRenderer :schema="store.camposSchema" mode="edit_template" @add-field="addField" @edit-field="editField" @move-field="moveField" @remove-field="store.removeField" />
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p><p v-if="success" class="form-message success" role="status">{{ success }}</p><div class="form-actions"><span>{{ store.totalFields }} campo{{ store.totalFields === 1 ? '' : 's' }}</span><button type="submit" :disabled="store.isSaving">{{ store.isSaving ? 'Salvando...' : 'Salvar template' }}</button></div>
    </form>
    <FieldEditorModal :model-value="modalOpen" :field="editing && editing.index >= 0 ? store.camposSchema[editing.section][editing.index] ?? null : null" :available-variables="Object.values(store.camposSchema).flat().map(({ id, label }) => ({ id, label })).filter(({ id }) => id)" @save="saveField" @close="closeModal" />
  </main>
</template>
<style scoped>
.template-builder{width:min(100%,960px);margin:0 auto}.page-header{margin-bottom:1.5rem}.page-header p{opacity:.75}.template-form{display:grid;gap:1rem}.template-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;padding:1.25rem;border:1px solid var(--color-border);border-radius:.75rem}.template-details label{display:grid;gap:.35rem;font-weight:600}.template-details input{width:100%;padding:.65rem .75rem;border:1px solid var(--color-border);border-radius:.4rem;background:var(--color-background);color:inherit;font:inherit}.sections{display:grid;gap:1rem}.form-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}.form-message{padding:.7rem .85rem;border-radius:.4rem}.error{color:#b42318;background:#fee4e2}.success{color:#067647;background:#d1fadf}button{min-height:2.4rem;padding:.5rem .85rem;border:1px solid transparent;border-radius:.4rem;color:#fff;background:#2563eb;font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.6}
</style>
