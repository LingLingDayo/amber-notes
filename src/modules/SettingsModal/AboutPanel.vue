<script setup lang="ts">
import SettingWrapper from './controls/SettingWrapper.vue';
import { SettingItem } from './settingsConfig';

defineProps<{
  item: SettingItem;
}>();

const version = __APP_VERSION__
</script>

<template>
  <SettingWrapper :item="item">
    <div class="about-wrapper">
      <div class="about-card">
        <img src="/logo.png" class="about-logo" alt="logo" />
        <div class="about-info">
          <h5 class="app-name">
            拾光便签
          </h5>
          <p class="app-version">
            Version {{ version }}
          </p>
        </div>
      </div>

      <div class="about-desc">
        拾光便签是专为 <strong>uTools</strong> 打造的轻量便签工具。界面清爽干净，动效丝滑流畅，方便您随时记录工作、学习与生活中的点滴想法。
      </div>
    </div>
  </SettingWrapper>
</template>

<style lang="scss" scoped>
.about-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.about-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 14px 0;
  border-radius: 12px;

  .about-logo {
    width: 44px;
    height: 44px;
  }

  .app-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .app-version {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }
}

.about-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}
</style>
