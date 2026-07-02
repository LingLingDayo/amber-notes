<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    placeholder?: string;
    type?: string;
    min?: number;
    max?: number;
    step?: number;
  }>(),
  {
    placeholder: '',
    type: 'text',
    min: undefined,
    max: undefined,
    step: undefined
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void;
}>();

const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const val = input.value;
  emit('update:modelValue', props.type === 'number' ? (val === '' ? '' : Number(val)) : val);
};

// 数字输入限制
const handleKeydown = (e: KeyboardEvent) => {
  if (props.type !== 'number') return;

  const allowedKeys = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Enter',
    'Home',
    'End'
  ];

  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  // 仅允许数字
  if (/^[0-9]$/.test(e.key)) {
    return;
  }

  // 负号逻辑
  if (e.key === '-' && (props.min === undefined || props.min < 0)) {
    const input = e.target as HTMLInputElement;
    if (!input.value.includes('-') && input.selectionStart === 0) {
      return;
    }
  }

  // 小数点逻辑 (基于 step 决定是否允许小数)
  const isDecimalAllowed = props.step ? props.step % 1 !== 0 : true;
  if (e.key === '.' && isDecimalAllowed) {
    const input = e.target as HTMLInputElement;
    if (!input.value.includes('.')) {
      return;
    }
  }

  e.preventDefault();
};

// 失去焦点合理性验证与边界纠正
const handleBlur = (e: FocusEvent) => {
  if (props.type !== 'number') return;

  const input = e.target as HTMLInputElement;
  const valStr = input.value.trim();

  if (valStr === '') {
    const fallback = props.min !== undefined ? props.min : 0;
    input.value = String(fallback); // 强制 DOM 拉回同步
    emit('update:modelValue', fallback);
    return;
  }

  let num = Number(valStr);
  if (isNaN(num)) {
    num = props.min !== undefined ? props.min : 0;
  }

  if (props.min !== undefined && num < props.min) {
    num = props.min;
  }
  if (props.max !== undefined && num > props.max) {
    num = props.max;
  }

  input.value = String(num); // 强制 DOM 拉回同步
  emit('update:modelValue', num);
};

// 聚焦状态下的鼠标滚轮微调
const handleWheel = (e: WheelEvent) => {
  if (props.type !== 'number') return;

  const input = e.target as HTMLInputElement;
  if (document.activeElement !== input) return;

  let currentVal = Number(props.modelValue);
  if (isNaN(currentVal)) {
    currentVal = props.min !== undefined ? props.min : 0;
  }

  let step = 1;
  if (e.ctrlKey) {
    step = 100;
  } else if (e.shiftKey) {
    step = 10;
  } else if (props.step !== undefined) {
    step = props.step;
  }

  const direction = e.deltaY < 0 ? 1 : -1;
  let newVal = currentVal + direction * step;

  if (props.min !== undefined && newVal < props.min) {
    newVal = props.min;
  }
  if (props.max !== undefined && newVal > props.max) {
    newVal = props.max;
  }

  input.value = String(newVal); // 强制 DOM 拉回同步
  emit('update:modelValue', newVal);
};
</script>

<template>
  <div class="setting-input-wrapper">
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      class="setting-input"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      @wheel.prevent="handleWheel"
    />
  </div>
</template>

<style lang="scss" scoped>
.setting-input-wrapper {
  width: 100%;
}

.setting-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--input-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--input-border, rgba(255, 255, 255, 0.08));
  color: var(--text-primary);
  font-size: 13px;
  transition: all 0.2s ease;
  outline: none;

  &:hover:not(:disabled) {
    border-color: var(--accent-color);
  }

  &:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-light);
  }

  &::placeholder {
    color: var(--text-muted);
    font-size: 12px;
  }
}
</style>
