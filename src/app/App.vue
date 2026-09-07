<template>
  <n-config-provider
    :theme="darkTheme"
    :theme-overrides="themeOverrides"
    :locale="esES"
    :date-locale="dateEsES"
  >
    <n-message-provider placement="bottom-right">
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { darkTheme, esES, dateEsES } from 'naive-ui'
import { themeOverrides } from './theme'
</script>