<script setup lang="ts">
defineProps<{ label: string; formula?: string | null; value: number }>();
</script>
<template>
  <div class="sheet-field formula-field"><div><span>{{ label }}</span><small v-if="formula">{{ formula }}</small></div><strong>{{ value }}</strong></div>
</template>
