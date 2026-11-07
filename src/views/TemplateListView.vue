<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { type ApiSuccess, type SheetTemplate } from '@motor-vtt/contracts';
import api from '@/services/api';
const router = useRouter(); const templates = ref<SheetTemplate[]>([]); const isLoading = ref(true); const error = ref(''); const deletingId = ref<string | null>(null);
function formatDate(value: string): string { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value)); }
async function loadTemplates(): Promise<void> { isLoading.value = true; error.value = ''; try { templates.value = (await api.get<ApiSuccess<SheetTemplate[]>>('/sheet-templates')).data.data; } catch { error.value = 'Não foi possível carregar seus templates. Tente novamente.'; } finally { isLoading.value = false; } }
async function removeTemplate(template: SheetTemplate): Promise<void> { if (!window.confirm(`Excluir o template "${template.nome}"?`)) return; deletingId.value = template.id; try { await api.delete(`/sheet-templates/${encodeURIComponent(template.id)}`); templates.value = templates.value.filter((item) => item.id !== template.id); } catch (requestError) { error.value = axios.isAxiosError(requestError) && requestError.response?.status === 409 ? 'Este template já está sendo usado e não pode ser excluído.' : 'Não foi possível excluir o template.'; } finally { deletingId.value = null; } }
onMounted(() => { void loadTemplates(); });
</script>
<template>
  <main class="template-list"><header class="page-header"><div><h1>Meus Templates de Ficha</h1><p>Gerencie os modelos usados nas suas salas.</p></div><button type="button" @click="router.push({ name: 'TemplateCreate' })">+ Criar Novo Template</button></header>
    <p v-if="isLoading" role="status">Carregando templates...</p><p v-else-if="error" class="form-message error" role="alert">{{ error }}</p><p v-else-if="templates.length === 0">Você ainda não criou nenhum template.</p>
    <section v-else class="template-grid" aria-label="Templates de ficha"><article v-for="template in templates" :key="template.id" class="template-card"><h2>{{ template.nome }}</h2><dl><div><dt>Sistema</dt><dd>{{ template.sistema || 'Não informado' }}</dd></div><div><dt>Criado em</dt><dd>{{ formatDate(template.createdAt) }}</dd></div></dl><footer><button type="button" @click="router.push({ name: 'TemplateEdit', params: { id: template.id } })">Editar</button><button type="button" class="danger" :disabled="deletingId === template.id" @click="removeTemplate(template)">{{ deletingId === template.id ? 'Excluindo...' : 'Excluir' }}</button></footer></article></section>
  </main>
</template>
<style scoped>
.template-list{width:min(100%,960px);margin:0 auto}.page-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.5rem}.page-header p{opacity:.75}.template-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.template-card{display:grid;gap:.8rem;padding:1.2rem;border:1px solid var(--color-border);border-radius:.75rem}.template-card h2{margin:0}.template-card dl{display:grid;gap:.5rem;margin:0}.template-card dl div{display:flex;justify-content:space-between;gap:1rem}.template-card dt{opacity:.7}.template-card dd{margin:0;text-align:right}.template-card footer{display:flex;gap:.6rem}button{min-height:2.4rem;padding:.5rem .85rem;border:1px solid transparent;border-radius:.4rem;color:#fff;background:#2563eb;font:inherit;cursor:pointer}.danger{background:#b42318}.form-message{padding:.7rem .85rem;border-radius:.4rem}.error{color:#b42318;background:#fee4e2}button:disabled{opacity:.6}
</style>
