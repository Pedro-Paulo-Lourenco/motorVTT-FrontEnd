<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ label: string; modelValue: { atual: number; maximo: number } }>();
const emit = defineEmits<{ 'update:modelValue': [value: { atual: number; maximo: number }] }>();
const percentage = computed(() => props.modelValue.maximo > 0
  ? Math.max(0, Math.min(100, (props.modelValue.atual / props.modelValue.maximo) * 100))
  : 0);

function updateCurrent(value: number): void {
  if (!Number.isFinite(value)) return;
  emit('update:modelValue', {
    atual: Math.max(0, Math.min(props.modelValue.maximo, value)),
    maximo: props.modelValue.maximo,
  });
}
function updateMaximum(event: Event): void {
  const maximo = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(maximo) || maximo < 1) return;
  emit('update:modelValue', { atual: Math.min(props.modelValue.atual, maximo), maximo });
}
function changeCurrent(delta: number): void {
  updateCurrent(props.modelValue.atual + delta);
}
function inputCurrent(event: Event): void {
  updateCurrent(Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div class="sheet-field resource-field">
    <div class="resource-label"><span>{{ label }}</span><strong>{{ modelValue.atual }} / {{ modelValue.maximo }}</strong></div>
    <div class="resource-track" role="progressbar" :aria-label="label" :aria-valuenow="modelValue.atual" :aria-valuemin="0" :aria-valuemax="modelValue.maximo">
      <span :style="{ width: `${percentage}%` }" />
    </div>
    <div class="resource-controls">
      <button type="button" aria-label="Diminuir recurso" @click="changeCurrent(-1)">−</button>
      <label>Atual<input type="number" min="0" :max="modelValue.maximo" :value="modelValue.atual" @input="inputCurrent"></label>
      <button type="button" aria-label="Aumentar recurso" @click="changeCurrent(1)">+</button>
      <label>Máximo<input type="number" min="1" :value="modelValue.maximo" @input="updateMaximum"></label>
    </div>
  </div>
</template>
