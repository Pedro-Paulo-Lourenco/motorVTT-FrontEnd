<script setup lang="ts">
import { sectionLabels, type BuilderField, type SheetSection } from '@/stores/sheetTemplateStore';
defineProps<{ section: SheetSection; fields: BuilderField[] }>();
const emit = defineEmits<{ add: []; edit: [index: number]; remove: [index: number] }>();
</script>
<template>
  <section class="builder-section" :aria-labelledby="`${section}-title`">
    <div class="section-heading"><div><h2 :id="`${section}-title`">{{ sectionLabels[section] }}</h2><p>{{ fields.length }} campo{{ fields.length === 1 ? '' : 's' }}</p></div><button type="button" @click="emit('add')">+ Adicionar campo</button></div>
    <p v-if="fields.length === 0" class="empty-section">Nenhum campo nesta seção.</p>
    <ul v-else class="field-list"><li v-for="(field, index) in fields" :key="`${field.id}-${index}`" class="field-row"><div><strong>{{ field.label || 'Sem rótulo' }}</strong><span class="field-meta">{{ field.id || 'sem-id' }} · {{ field.type }}<template v-if="field.formula"> · {{ field.formula }}</template></span></div><div class="row-actions"><button type="button" class="secondary-button" @click="emit('edit', index)">Editar</button><button type="button" class="danger-button" @click="emit('remove', index)">Remover</button></div></li></ul>
  </section>
</template>
<style scoped>
.builder-section{display:grid;gap:1rem;padding:1.25rem;border:1px solid var(--color-border);border-radius:.75rem}.section-heading,.field-row,.row-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem}.section-heading p,.field-meta,.empty-section{color:var(--color-text);opacity:.7}.field-list{display:grid;gap:.65rem;padding:0;list-style:none}.field-row{padding:.8rem;border:1px solid var(--color-border);border-radius:.45rem}.field-row>div:first-child{min-width:0;display:grid;gap:.15rem}.field-meta{overflow-wrap:anywhere;font-size:.85rem}.secondary-button,.danger-button{padding:.4rem .65rem;border:1px solid var(--color-border);border-radius:.35rem;background:transparent;color:inherit;cursor:pointer}.danger-button{color:#b42318}@media(max-width:600px){.field-row{align-items:flex-start;flex-direction:column}}
</style>
