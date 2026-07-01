<script lang="ts" setup>
import { computed } from 'vue';
import SettingInput from './controls/SettingInput.vue';
import SettingTextarea from './controls/SettingTextarea.vue';
import SettingSelect from './controls/SettingSelect.vue';
import SettingRadio from './controls/SettingRadio.vue';
import SettingButton from './controls/SettingButton.vue';
import { SettingItem } from './settingsConfig';
import { useStickyNotesStore } from '@stores/stickyNotes';

const props = defineProps<{
  modelValue: any;
  item: SettingItem;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void;
  (e: 'action', actionKey: string): void;
}>();

const store = useStickyNotesStore();

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 计算样式以支持自定义宽度百分比
const groupStyle = computed(() => {
  if (!props.item.width) return {};
  if (props.item.width.endsWith('%')) {
    const percent = parseFloat(props.item.width);
    // 扣除 flex 布局下的 gap 宽度影响。我们在父容器使用 gap: 20px 16px，所以列 gap 是 16px
    const ratio = percent / 100;
    return {
      width: `calc(${percent}% - ${(1 - ratio) * 16}px)`
    };
  }
  return { width: props.item.width };
});

const resolveButtonLabel = (btn: any) => {
  if (typeof btn.label === 'function') {
    return btn.label(store);
  }
  return btn.label;
};

const resolveButtonDisabled = (btn: any) => {
  if (typeof btn.disabled === 'function') {
    return btn.disabled(store);
  }
  return !!btn.disabled;
};

const resolveButtonVisible = (btn: any) => {
  if (btn.visible === undefined) return true;
  if (typeof btn.visible === 'function') {
    return btn.visible(store);
  }
  return !!btn.visible;
};

const isVisible = computed(() => {
  if (props.item.visible === undefined) return true;
  if (typeof props.item.visible === 'function') {
    return props.item.visible(store);
  }
  return !!props.item.visible;
});
</script>

<template>
  <div
    v-if="isVisible"
    class="settings-group"
    :class="[`type-${item.type}`, { 'is-partial-width': item.width && item.width !== '100%' }]"
    :style="groupStyle"
  >
    <div class="group-header">
      <div class="group-label">
        {{ item.label }}
      </div>
      <div v-if="item.desc" class="group-desc">
        {{ item.desc }}
      </div>
    </div>

    <div class="group-control">
      <!-- 1. Input -->
      <SettingInput
        v-if="item.type === 'input'"
        v-model="value"
        :placeholder="item.placeholder"
        v-bind="item.props"
      />

      <!-- 2. Textarea -->
      <SettingTextarea
        v-else-if="item.type === 'textarea'"
        v-model="value"
        :placeholder="item.placeholder"
        v-bind="item.props"
      />

      <!-- 3. Select / Multiselect -->
      <SettingSelect
        v-else-if="item.type === 'select' || item.type === 'multiselect'"
        v-model="value"
        :options="item.options || []"
        :multiple="item.type === 'multiselect'"
        :placeholder="item.placeholder"
        v-bind="item.props"
      />

      <!-- 4. Radio -->
      <SettingRadio
        v-else-if="item.type === 'radio'"
        v-model="value"
        :options="item.options || []"
      />

      <!-- 5. Button Group -->
      <div v-else-if="item.type === 'button-group'" class="quick-actions-row">
        <template v-for="btn in item.buttons" :key="btn.actionKey">
          <SettingButton
            v-if="resolveButtonVisible(btn)"
            :variant="btn.variant"
            :width="btn.width"
            :min-width="btn.minWidth"
            :color="btn.color"
            :disabled="resolveButtonDisabled(btn)"
            @click="emit('action', btn.actionKey)"
          >
            <component :is="btn.icon" v-if="btn.icon" class="control-icon" />
            <span>{{ resolveButtonLabel(btn) }}</span>
          </SettingButton>
        </template>
      </div>

      <!-- 6. Custom Component -->
      <component
        :is="item.component"
        v-else-if="item.type === 'component' && item.component"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  box-sizing: border-box;

  .group-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .group-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .group-desc {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .group-control {
    display: flex;
    gap: 10px;
    margin: 4px 0;
    width: 100%;
  }
}

.quick-actions-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

@media (max-width: 599px) {
  .settings-group {
    width: 100% !important;
  }
}
</style>
