<script lang="ts" setup>
import { useShortcutStore } from '@stores/shortcutStore';
import SettingControl from './SettingControl.vue';
import SettingWrapper from './controls/SettingWrapper.vue';
import { SettingItem } from './settingsConfig';

defineProps<{
  item: SettingItem;
}>();

const shortcutStore = useShortcutStore();
</script>

<template>
  <SettingWrapper :item="item">
    <div class="shortcut-panel">
      <!-- 1. 自定义快捷键项 (平铺渲染) -->
      <SettingControl
        v-for="shortcut in shortcutStore.shortcuts"
        :key="shortcut.id"
        v-model="shortcut.currentKey"
        :item="{
          key: shortcut.id,
          label: shortcut.name,
          type: 'shortcut',
          tooltip: shortcut.description
        }"
      />

      <!-- 2. 通用快捷操作说明控件 (平铺渲染) -->
      <SettingControl
        :model-value="null"
        :item="{
          key: 'shortcutTips',
          label: '快捷操作指南',
          type: 'text',
          content: `<ul>
            <li><strong>双击隐藏粘贴：</strong>双击便签卡片会直接自动收起窗口，并自动将便签内容填至您原先光标所在的输入位置。</li>
            <li><strong>捕获外部文本：</strong>在 uTools 的超级面板中，可以直接选中文本一键导入并创建新便签。</li>
          </ul>`
        }"
      />
    </div>
  </SettingWrapper>
</template>

<style lang="scss" scoped>
.shortcut-panel {
  display: contents;
}
</style>
