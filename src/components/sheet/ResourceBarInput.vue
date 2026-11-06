<script setup lang="ts">
const props = defineProps<{ label: string; modelValue: { atual: number; maximo: number } }>();
const emit = defineEmits<{ 'update:modelValue': [value: { atual: number; maximo: number }] }>();
function updateCurrent(event: Event): void {
  const atual = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(atual)) emit('update:modelValue', { atual, maximo: props.modelValue.maximo });
}
function updateMaximum(event: Event): void {
  const maximo = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(maximo)) emit('update:modelValue', { atual: Math.min(props.modelValue.atual, maximo), maximo });
}
</script>
<template>
  <div class="sheet-field resource-field">
    <div class="resource-label"><span>{{ label }}</span><strong>{{ modelValue.atual }} / {{ modelValue.maximo }}</strong></div>
    <input class="resource-range" type="range" min="0" :max="modelValue.maximo" :value="modelValue.atual" @input="updateCurrent" />
    <div class="resource-values"><label>Atual<input type="number" min="0" :max="modelValue.maximo" :value="modelValue.atual" @input="updateCurrent" /></label><label>Máximo<input type="number" min="1" :value="modelValue.maximo" @input="updateMaximum" /></label></div>
  </div>
</template>
