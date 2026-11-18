<script setup lang="ts">
// Apresentação somente leitura de campo calculado usada pelo renderizador da ficha.
// Exibe rótulo, fórmula opcional e o valor numérico calculado.
defineProps<{ label: string; formula?: string | null; value: number }>();
</script>

<template>
  <div class="formula-field">
    <div><span>{{ label }}</span><small v-if="formula">{{ formula }}</small></div>
    <strong>{{ value }}</strong>
  </div>
</template>
