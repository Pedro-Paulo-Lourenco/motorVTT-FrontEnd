<script setup lang="ts">
// Entrada numérica controlada usada pelos atributos da ficha.
// Emite apenas números finitos e deixa armazenamento e validação para o componente pai.
const props = defineProps<{ label: string; modelValue: number; min?: number | null; max?: number | null }>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

function update(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) emit('update:modelValue', value);
}
</script>

<template>
  <label class="sheet-field">
    <span>{{ label }}</span>
    <input type="number" :value="modelValue" :min="min ?? undefined" :max="max ?? undefined" @input="update">
  </label>
</template>
