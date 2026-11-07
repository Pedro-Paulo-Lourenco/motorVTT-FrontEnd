<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { characterSheetSchema, sheetTemplateSchema, type SheetTemplate } from '@motor-vtt/contracts';
import { z } from 'zod';
import api from '@/services/api';
import CharacterSheetDrawer from '@/components/sheet/CharacterSheetDrawer.vue';

type LibrarySheet = ReturnType<typeof characterSheetSchema.parse>;
const router = useRouter();
const activeTab = ref<'sheets' | 'templates'>('sheets');
const sheets = ref<LibrarySheet[]>([]);
const templates = ref<SheetTemplate[]>([]);
const selectedSheet = ref<string | null>(null);
const loading = ref(true);
const error = ref('');
const actionError = ref('');
const cloningId = ref<string | null>(null);
const isCreateOpen = ref(false);
const newSheetName = ref('');
const newSheetTemplateId = ref('');
const isCreatingSheet = ref(false);
const templateById = computed(() => new Map(templates.value.map((template) => [template.id, template])));

async function loadLibrary(): Promise<void> {
  loading.value = true; error.value = '';
  try {
    const response = await api.get('/user/library');
    const parsed = z.object({ success: z.literal(true), data: z.object({ sheets: z.array(characterSheetSchema), templates: z.array(sheetTemplateSchema) }) }).parse(response.data);
    sheets.value = parsed.data.sheets; templates.value = parsed.data.templates;
  } catch { error.value = 'Não foi possível carregar sua biblioteca.'; }
  finally { loading.value = false; }
}
async function createPersonalSheet(): Promise<void> {
  if (!newSheetName.value.trim() || !newSheetTemplateId.value || isCreatingSheet.value) return;
  isCreatingSheet.value = true; actionError.value = '';
  try {
    const response = await api.post<{ data: LibrarySheet }>('/character-sheets', { templateId: newSheetTemplateId.value, nome: newSheetName.value.trim() });
    sheets.value.unshift(response.data.data);
    isCreateOpen.value = false; newSheetName.value = '';
  } catch { actionError.value = 'Não foi possível criar a ficha.'; }
  finally { isCreatingSheet.value = false; }
}

async function cloneSheet(sheet: LibrarySheet): Promise<void> {
  cloningId.value = sheet.id; actionError.value = '';
  try { const response = await api.post<{ data: LibrarySheet }>(`/character-sheets/${sheet.id}/clone`); sheets.value.unshift(response.data.data); }
  catch { actionError.value = 'Não foi possível duplicar a ficha.'; }
  finally { cloningId.value = null; }
}
async function cloneTemplate(template: SheetTemplate): Promise<void> {
  cloningId.value = template.id; actionError.value = '';
  try { const response = await api.post<{ data: SheetTemplate }>(`/sheet-templates/${template.id}/clone`); templates.value.unshift(response.data.data); }
  catch { actionError.value = 'Não foi possível duplicar o template.'; }
  finally { cloningId.value = null; }
}
function shareSheet(sheet: LibrarySheet): void { void navigator.clipboard?.writeText(`${window.location.origin}/biblioteca?ficha=${sheet.id}`); actionError.value = 'Link de exportação copiado.'; }
function shareTemplate(template: SheetTemplate): void { void navigator.clipboard?.writeText(`${window.location.origin}/biblioteca?template=${template.id}`); actionError.value = 'Link de exportação copiado.'; }
onMounted(async () => {
  await loadLibrary();
  const requestedSheet = new URLSearchParams(window.location.search).get('ficha');
  if (requestedSheet && sheets.value.some((sheet) => sheet.id === requestedSheet)) selectedSheet.value = requestedSheet;
});
</script>
<template>
  <main class="library-page">
    <header class="library-header"><div><p class="eyebrow">Meu espaço de jogo</p><h1>Biblioteca pessoal</h1><p>Crie e prepare suas fichas antes de entrar em uma sala.</p></div><div class="header-actions"><button type="button" @click="isCreateOpen = true">+ Nova ficha</button><button type="button" class="secondary" @click="router.push({ name: 'TemplateCreate' })">+ Novo template</button></div></header>
    <nav class="library-tabs" aria-label="Biblioteca"><button type="button" :class="{ active: activeTab === 'sheets' }" @click="activeTab = 'sheets'">Minhas Fichas</button><button type="button" :class="{ active: activeTab === 'templates' }" @click="activeTab = 'templates'">Meus Templates</button></nav>
    <p v-if="loading" role="status">Carregando biblioteca...</p><p v-else-if="error" class="error" role="alert">{{ error }}</p><p v-if="actionError" class="notice" role="status">{{ actionError }}</p>
    <section v-if="!loading && activeTab === 'sheets'" class="card-grid"><article v-for="sheet in sheets" :key="sheet.id" class="library-card"><div><p class="card-kind">Ficha de personagem</p><h2>{{ sheet.nome }}</h2><p>{{ templateById.get(sheet.templateId)?.nome || 'Template indisponível' }}</p></div><footer><button type="button" @click="selectedSheet = sheet.id">Visualizar e editar</button><button type="button" class="secondary" :disabled="cloningId === sheet.id" @click="cloneSheet(sheet)">{{ cloningId === sheet.id ? 'Duplicando...' : 'Duplicar' }}</button><button type="button" class="secondary" @click="shareSheet(sheet)">Compartilhar</button></footer></article><p v-if="sheets.length === 0" class="empty">Você ainda não possui fichas. Crie uma na sala ou escolha um template para começar.</p></section>
    <section v-if="!loading && activeTab === 'templates'" class="card-grid"><article v-for="template in templates" :key="template.id" class="library-card"><div><p class="card-kind">Template</p><h2>{{ template.nome }}</h2><p>{{ template.sistema || 'Sistema não informado' }}</p></div><footer><button type="button" @click="router.push({ name: 'TemplateEdit', params: { id: template.id } })">Editar</button><button type="button" class="secondary" :disabled="cloningId === template.id" @click="cloneTemplate(template)">{{ cloningId === template.id ? 'Duplicando...' : 'Duplicar' }}</button><button type="button" class="secondary" @click="shareTemplate(template)">Compartilhar</button></footer></article><p v-if="templates.length === 0" class="empty">Você ainda não possui templates.</p></section>
    <div v-if="isCreateOpen" class="modal-backdrop" role="presentation" @click.self="isCreateOpen = false">
      <section class="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-sheet-title">
        <h2 id="create-sheet-title">Criar ficha pessoal</h2>
        <label for="personal-sheet-name">Nome da ficha</label><input id="personal-sheet-name" v-model="newSheetName" maxlength="160" placeholder="Ex.: Aria, a patrulheira" />
        <label for="personal-sheet-template">Template</label><select id="personal-sheet-template" v-model="newSheetTemplateId"><option disabled value="">Selecione um template</option><option v-for="template in templates" :key="template.id" :value="template.id">{{ template.nome }}</option></select>
        <p v-if="templates.length === 0" class="error">Crie um template antes de criar sua ficha.</p>
        <footer><button type="button" class="secondary" @click="isCreateOpen = false">Cancelar</button><button type="button" :disabled="isCreatingSheet || !newSheetName.trim() || !newSheetTemplateId" @click="createPersonalSheet">{{ isCreatingSheet ? 'Criando...' : 'Criar ficha' }}</button></footer>
      </section>
    </div>
    <CharacterSheetDrawer :open="selectedSheet !== null" :sheet-id="selectedSheet" @close="selectedSheet = null" />
  </main>
</template>
<style scoped>
.library-page{width:min(100%,1100px);margin:0 auto}.library-header{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.5rem}.header-actions{display:flex;flex-wrap:wrap;gap:.5rem}.library-header h1{margin:.2rem 0}.library-header p{opacity:.75}.eyebrow,.card-kind{margin:0;color:#a86f2a;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase}.library-tabs{display:flex;gap:.5rem;border-bottom:1px solid var(--color-border);margin-bottom:1.5rem}.library-tabs button{border:0;border-bottom:3px solid transparent;border-radius:0;background:transparent;color:inherit}.library-tabs button.active{border-color:#a86f2a;font-weight:700}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1rem}.library-card{display:flex;min-height:170px;flex-direction:column;justify-content:space-between;gap:1rem;padding:1.2rem;border:1px solid var(--color-border);border-radius:.7rem}.library-card h2{margin:.4rem 0;font-size:1.2rem}.library-card p:not(.card-kind){opacity:.7}.library-card footer{display:flex;flex-wrap:wrap;gap:.45rem}.secondary{background:transparent;color:inherit;border-color:var(--color-border)}.empty{grid-column:1/-1;padding:2rem;text-align:center;opacity:.7}.error{color:#b42318}.notice{padding:.7rem;background:#fff3cd;border-radius:.4rem}button{min-height:2.35rem;padding:.45rem .75rem;border:1px solid transparent;border-radius:.4rem;background:#2563eb;color:#fff;font:inherit;cursor:pointer}.modal-backdrop{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:1rem;background:#18251dcc}.create-modal{display:grid;gap:.65rem;width:min(100%,30rem);padding:1.3rem;border-radius:.7rem;background:var(--color-background);box-shadow:0 1.5rem 4rem #0005}.create-modal h2{margin:0 0 .4rem}.create-modal input,.create-modal select{min-height:2.4rem;padding:.45rem}.create-modal footer{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.5rem}button:disabled{opacity:.6}
</style>
