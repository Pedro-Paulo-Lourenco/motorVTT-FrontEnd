<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { type ApiSuccess, type SheetTemplate } from '@motor-vtt/contracts';
import SectionBuilder from '@/components/SectionBuilder.vue';
import FieldEditorModal from '@/components/FieldEditorModal.vue';
import { useSheetTemplateStore, type BuilderField, type SheetSection } from '@/stores/sheetTemplateStore';
import api from '@/services/api';
const store = useSheetTemplateStore();
const sections: SheetSection[] = ['cabecalho', 'atributos', 'recursos', 'pericias'];
const modalOpen = ref(false); const editing = ref<{ section: SheetSection; index: number } | null>(null); const error = ref(''); const success = ref('');
function addField(section: SheetSection): void { editing.value = { section, index: -1 }; modalOpen.value = true; }
function editField(section: SheetSection, index: number): void { editing.value = { section, index }; modalOpen.value = true; }
function saveField(field: BuilderField): void { if (!editing.value) return; if (editing.value.index < 0) store.addField(editing.value.section, field); else store.updateField(editing.value.section, editing.value.index, field); closeModal(); }
function closeModal(): void { modalOpen.value = false; editing.value = null; }
async function saveTemplate(): Promise<void> {
  error.value = ''; success.value = ''; const validationError = store.validate(); if (validationError) { error.value = validationError; return; } store.isSaving = true;
  try { const response = await api.post<ApiSuccess<SheetTemplate>>('/api/sheet-templates', { nome: store.nome.trim(), sistema: store.sistema.trim() || null, camposSchema: store.camposSchema }); success.value = `Template "${response.data.data.nome}" criado com sucesso.`; }
  catch (requestError) { error.value = axios.isAxiosError(requestError) && requestError.response?.status === 400 ? 'Os dados do template são inválidos. Revise os campos.' : 'Não foi possível salvar o template. Tente novamente.'; }
  finally { store.isSaving = false; }
}
</script>
<template>
  <main class="template-builder"><header class="page-header"><div><h1>Construtor de template</h1><p>Monte uma ficha customizada para sua mesa.</p></div></header>
    <form class="template-form" :aria-busy="store.isSaving" @submit.prevent="saveTemplate">
      <div class="template-details"><label>Nome do template<input v-model="store.nome" maxlength="160" type="text" required placeholder="Ex.: Ficha de fantasia" /></label><label>Sistema (opcional)<input v-model="store.sistema" maxlength="80" type="text" placeholder="Ex.: D&amp;D 5e" /></label></div>
      <div class="sections"><SectionBuilder v-for="section in sections" :key="section" :section="section" :fields="store.camposSchema[section]" @add="addField(section)" @edit="editField(section, $event)" @remove="store.removeField(section, $event)" /></div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p><p v-if="success" class="form-message success" role="status">{{ success }}</p><div class="form-actions"><span>{{ store.totalFields }} campo{{ store.totalFields === 1 ? '' : 's' }}</span><button type="submit" :disabled="store.isSaving">{{ store.isSaving ? 'Salvando...' : 'Salvar template' }}</button></div>
    </form>
    <FieldEditorModal :model-value="modalOpen" :field="editing && editing.index >= 0 ? store.camposSchema[editing.section][editing.index] ?? null : null" @save="saveField" @close="closeModal" />
  </main>
</template>
<style scoped>
.template-builder{width:min(100%,960px);margin:0 auto}.page-header{margin-bottom:1.5rem}.page-header p{opacity:.75}.template-form{display:grid;gap:1rem}.template-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;padding:1.25rem;border:1px solid var(--color-border);border-radius:.75rem}.template-details label{display:grid;gap:.35rem;font-weight:600}.template-details input{width:100%;padding:.65rem .75rem;border:1px solid var(--color-border);border-radius:.4rem;background:var(--color-background);color:inherit;font:inherit}.sections{display:grid;gap:1rem}.form-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}.form-message{padding:.7rem .85rem;border-radius:.4rem}.error{color:#b42318;background:#fee4e2}.success{color:#067647;background:#d1fadf}button{min-height:2.4rem;padding:.5rem .85rem;border:1px solid transparent;border-radius:.4rem;color:#fff;background:#2563eb;font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.6}
</style>
