<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { type ApiSuccess, type SheetTemplate } from '@motor-vtt/contracts';
import api from '@/services/api';

const props = defineProps<{ roomId: string }>();
const emit = defineEmits<{ close: [] }>();
const templates = ref<SheetTemplate[]>([]);
const roomTemplates = ref<SheetTemplate[]>([]);
const isLoading = ref(true);
const error = ref('');
const selectedTemplateId = ref('');
const isSaving = ref(false);

async function load(): Promise<void> {
  isLoading.value = true;
  error.value = '';
  try {
    const [availableResponse, roomResponse] = await Promise.all([
      api.get<ApiSuccess<SheetTemplate[]>>('/sheet-templates'),
      api.get<ApiSuccess<SheetTemplate[]>>(`/rooms/${encodeURIComponent(props.roomId)}/templates`),
    ]);
    templates.value = availableResponse.data.data;
    roomTemplates.value = roomResponse.data.data;
  } catch {
    error.value = 'Não foi possível carregar os templates desta sala.';
  } finally {
    isLoading.value = false;
  }
}

async function addTemplate(): Promise<void> {
  if (!selectedTemplateId.value || isSaving.value) return;
  isSaving.value = true;
  error.value = '';
  try {
    await api.post(`/rooms/${encodeURIComponent(props.roomId)}/templates/${encodeURIComponent(selectedTemplateId.value)}`);
    const template = templates.value.find((item) => item.id === selectedTemplateId.value);
    if (template && !roomTemplates.value.some((item) => item.id === template.id)) roomTemplates.value.push(template);
    selectedTemplateId.value = '';
  } catch {
    error.value = 'Não foi possível adicionar este template à sala.';
  } finally {
    isSaving.value = false;
  }
}

async function removeTemplate(template: SheetTemplate): Promise<void> {
  if (isSaving.value) return;
  isSaving.value = true;
  error.value = '';
  try {
    await api.delete(`/rooms/${encodeURIComponent(props.roomId)}/templates/${encodeURIComponent(template.id)}`);
    roomTemplates.value = roomTemplates.value.filter((item) => item.id !== template.id);
  } catch {
    error.value = 'Não foi possível remover este template da sala.';
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => { void load(); });
</script>

<template>
  <div class="settings-backdrop" role="presentation" @click.self="emit('close')">
    <section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="room-settings-title">
      <header>
        <div><p class="eyebrow">Configuração da campanha</p><h2 id="room-settings-title">Templates da sala</h2></div>
        <button type="button" class="close-button" aria-label="Fechar configurações" @click="emit('close')">×</button>
      </header>
      <p v-if="isLoading" role="status">Carregando templates...</p>
      <template v-else>
        <label for="room-settings-template">Adicionar template</label>
        <div class="add-row">
          <select id="room-settings-template" v-model="selectedTemplateId" :disabled="isSaving">
            <option value="">Selecione um template</option>
            <option v-for="template in templates.filter((item) => !roomTemplates.some((current) => current.id === item.id))" :key="template.id" :value="template.id">{{ template.nome }}{{ template.sistema ? ` (${template.sistema})` : '' }}</option>
          </select>
          <button type="button" :disabled="!selectedTemplateId || isSaving" @click="addTemplate">Adicionar</button>
        </div>
        <p v-if="roomTemplates.length === 0">Nenhum template vinculado a esta sala.</p>
        <ul v-else class="template-list">
          <li v-for="template in roomTemplates" :key="template.id"><span>{{ template.nome }}<small v-if="template.sistema"> · {{ template.sistema }}</small></span><button type="button" class="danger" :disabled="isSaving" @click="removeTemplate(template)">Remover</button></li>
        </ul>
      </template>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <footer><button type="button" class="secondary-button" @click="emit('close')">Concluir</button></footer>
    </section>
  </div>
</template>

<style scoped>
.settings-backdrop{position:fixed;inset:0;z-index:10;display:grid;place-items:center;padding:1rem;background:#18251dcc}.settings-modal{display:grid;gap:1rem;width:min(100%,560px);max-height:90vh;overflow:auto;padding:1.4rem;border:1px solid var(--color-border);border-radius:.75rem;background:var(--color-background);box-shadow:0 1.5rem 4rem #0005}.settings-modal header,.settings-modal footer,.add-row,.template-list li{display:flex;align-items:center;justify-content:space-between;gap:.75rem}.settings-modal h2{margin:0}.close-button{padding:.1rem .5rem;font-size:1.5rem;background:transparent;color:inherit}.add-row select{flex:1;min-height:2.4rem;padding:.45rem}.template-list{display:grid;gap:.5rem;margin:0;padding:0;list-style:none}.template-list li{padding:.7rem;border-top:1px solid var(--color-border)}small{opacity:.7}.danger{background:#b42318}.secondary-button{color:inherit;background:transparent;border-color:var(--color-border)}button{min-height:2.4rem;padding:.45rem .8rem;border:1px solid transparent;border-radius:.4rem;color:#fff;background:#526c55;font:inherit;cursor:pointer}button:disabled{opacity:.55}.error-message{margin:0;color:#b42318}
</style>
<style scoped>
.settings-backdrop { z-index: 100; }
</style>
