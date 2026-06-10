<script lang="ts" setup>
import { ref, nextTick } from 'vue';
import { useStickyNotesStore } from '@stores/stickyNotes';
import { Folder, Edit3, Trash2, Check, ChevronDown, ChevronRight, Plus } from 'lucide-vue-next';
import { isUTools } from '@/utils/storage';

const store = useStickyNotesStore();

// 处于编辑重命名状态的分类ID
const editingId = ref<string | null>(null);
const editCategoryName = ref('');
const editInputRef = ref<HTMLInputElement | null>(null);

const subAddInputRef = ref<HTMLInputElement | null>(null);

const setEditInputRef = (el: any) => {
  editInputRef.value = el as HTMLInputElement | null;
};

const setSubAddInputRef = (el: any) => {
  subAddInputRef.value = el as HTMLInputElement | null;
};

// 开启编辑
const startEdit = async (id: string, currentName: string) => {
  editingId.value = id;
  editCategoryName.value = currentName;
  await nextTick();
  if (editInputRef.value) {
    editInputRef.value.focus();
    editInputRef.value.select();
  }
};

// 取消编辑
const cancelEdit = () => {
  editingId.value = null;
  editCategoryName.value = '';
};

// 提交编辑
const submitEdit = (id: string) => {
  const name = editCategoryName.value.trim();
  if (name) {
    store.updateCategory(id, name);
    store.showToast(`分类已重命名为 "${name}"`);
    editingId.value = null;
  } else {
    cancelEdit();
  }
};

// 删除分类
const confirmDelete = async (id: string, name: string) => {
  const ok = await store.askConfirm(
    '确认删除分类',
    `确定要删除分类 "${name}" 吗？该分类下的子分类与便签不会被删除，将分别自动上移与变为未分类状态。`
  );
  if (ok) {
    store.deleteCategory(id);
    store.showToast(`分类 "${name}" 已删除`);
  }
};

// 获取某个分类下的便签总数
const getNoteCount = (categoryId: string) => {
  if (categoryId === 'all') {
    return store.notes.filter(n => n.isDeleted !== true).length;
  }
  const descendants = store.getCategoryDescendants(categoryId);
  return store.notes.filter(n => (n.categoryId === categoryId || descendants.has(n.categoryId)) && n.isDeleted !== true).length;
};

// 拖动排序相关的状态与方法
const draggedIndex = ref<number | null>(null);
let lastSwapTime = 0;

const onDragStart = (event: DragEvent, index: number) => {
  const cat = store.orderedCategories[index];
  if (cat && (cat.isSystem || cat.isVirtualAdd)) {
    event.preventDefault();
    return;
  }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
  lastSwapTime = 0; // 重置冷却时间
  setTimeout(() => {
    draggedIndex.value = index;
  }, 0);
};

const onDragOver = (event: DragEvent, index: number) => {
  if (draggedIndex.value === null || draggedIndex.value === index) return;

  const draggedCat = store.orderedCategories[draggedIndex.value];
  const targetCat = store.orderedCategories[index];
  if (!draggedCat || !targetCat) return;
  if (draggedCat.isSystem || targetCat.isSystem) return;
  if (draggedCat.isVirtualAdd || targetCat.isVirtualAdd) return;
  if (draggedCat.parentId !== targetCat.parentId) return;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const clientY = event.clientY;
  const threshold = rect.top + rect.height / 2;

  // 向下拖拽：鼠标必须穿过目标元素中线以下
  if (draggedIndex.value < index) {
    if (clientY < threshold) return;
  } 
  // 向上拖拽：鼠标必须穿过目标元素中线以上
  else if (draggedIndex.value > index) {
    if (clientY > threshold) return;
  }

  // 150ms 冷却节流，防止在 FLIP 动画位移期间发生位置跳跃产生的振荡
  const now = Date.now();
  if (now - lastSwapTime < 150) return;
  lastSwapTime = now;

  store.reorderCategories(draggedIndex.value, index);
  draggedIndex.value = index;
};

const onDragEnd = () => {
  draggedIndex.value = null;
};

// 子分类增加逻辑
const startAddSub = async (parentId: string) => {
  store.addingSubParentId = parentId;
  store.newSubCategoryName = '';
  
  // 展开父分类
  if (store.collapsedCategoryIds.includes(parentId)) {
    store.toggleCategoryCollapse(parentId);
  }
  
  await nextTick();
  if (subAddInputRef.value) {
    subAddInputRef.value.focus();
  }
};

const cancelAddSub = () => {
  store.addingSubParentId = null;
  store.newSubCategoryName = '';
};

const submitAddSub = (parentId?: string) => {
  const name = store.newSubCategoryName.trim();
  if (name) {
    store.addCategory(name, parentId);
    store.showToast(`已成功创建子分类 "${name}"`);
  }
  cancelAddSub();
};

</script>

<template>
  <div :class="{ 'uTools': isUTools() }" class="sidebar-menu">
    <TransitionGroup 
      tag="div" 
      name="category-list" 
      style="display: flex; flex-direction: column; gap: 6px;"
    >
      <div 
        v-for="(cat, index) in store.orderedCategories" 
        :key="cat.id"
        class="menu-item"
        :class="{ 
          active: store.currentCategoryId === cat.id,
          'has-actions': !cat.isSystem && !cat.isVirtualAdd,
          'dragging': draggedIndex === index
        }"
        :draggable="editingId !== cat.id && !cat.isVirtualAdd"
        :style="{ '--item-level': cat.level || 0 }"
        @click="store.currentCategoryId = cat.isVirtualAdd ? store.currentCategoryId : cat.id"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @dragend="onDragEnd"
      >
        <div class="active-indicator"></div>
        
        <!-- Toggle button for subcategories -->
        <span 
          v-if="!cat.isSystem && cat.hasChildren"
          class="collapse-toggle"
          @click.stop="store.toggleCategoryCollapse(cat.id)"
        >
          <ChevronDown v-if="!cat.isCollapsed" class="toggle-icon" />
          <ChevronRight v-else class="toggle-icon" />
        </span>
        <span v-else-if="!cat.isSystem && cat.level > 0" class="collapse-toggle-spacer"></span>

        <!-- 系统分类 (全部便签) -->
        <template v-if="cat.isSystem">
          <div class="item-left">
            <Folder class="item-icon" />
            <span class="item-name" data-tooltip="全部便签">全部便签</span>
          </div>
          <span class="item-badge">{{ getNoteCount('all') }}</span>
        </template>
  
        <!-- 用户自定义分类 or 虚拟新增子分类 -->
        <template v-else>
          <!-- 虚拟新增分类状态 -->
          <div v-if="cat.isVirtualAdd" class="item-edit-wrapper" @click.stop>
            <input 
              :ref="setSubAddInputRef"
              v-model="store.newSubCategoryName"
              type="text" 
              placeholder="子分类名称..."
              class="item-edit-input"
              @keyup.enter="submitAddSub(cat.parentId)"
              @keyup.esc="cancelAddSub"
              @blur="submitAddSub(cat.parentId)"
            />
            <button class="edit-btn confirm" @click="submitAddSub(cat.parentId)">
              <Check class="btn-icon-small" />
            </button>
          </div>

          <!-- 编辑状态 -->
          <div v-else-if="editingId === cat.id" class="item-edit-wrapper" @click.stop>
            <input 
              :ref="setEditInputRef"
              v-model="editCategoryName"
              type="text" 
              class="item-edit-input"
              @keyup.enter="submitEdit(cat.id)"
              @keyup.esc="cancelEdit"
              @blur="submitEdit(cat.id)"
            />
            <button class="edit-btn confirm" @click="submitEdit(cat.id)">
              <Check class="btn-icon-small" />
            </button>
          </div>
  
          <!-- 正常展示状态 -->
          <template v-else>
            <div class="item-left">
              <Folder class="item-icon" />
              <span class="item-name" :data-tooltip="cat.name" @dblclick="startEdit(cat.id, cat.name)">{{ cat.name }}</span>
            </div>
            
            <div class="item-right" @click.stop>
              <span class="item-badge">{{ getNoteCount(cat.id) }}</span>
              <div class="item-actions">
                <!-- 添加子分类 -->
                <button class="action-btn" data-tooltip="添加子分类" @click="startAddSub(cat.id)">
                  <Plus class="action-icon" />
                </button>

                <button class="action-btn" data-tooltip="编辑分类" @click="startEdit(cat.id, cat.name)">
                  <Edit3 class="action-icon" />
                </button>
                <button class="action-btn delete" data-tooltip="删除分类" @click="confirmDelete(cat.id, cat.name)">
                  <Trash2 class="action-icon" />
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </TransitionGroup>

    <!-- 分割线 -->
    <div class="menu-divider"></div>

    <!-- 垃圾箱分类 -->
    <div 
      class="menu-item trash-item"
      :class="{ active: store.currentCategoryId === 'trash' }"
      @click="store.currentCategoryId = 'trash'"
    >
      <div class="active-indicator"></div>
      <div class="item-left">
        <Trash2 class="item-icon" />
        <span class="item-name" data-tooltip="已删除的便签">垃圾箱</span>
      </div>
      <span class="item-badge">{{ store.trashNotesCount }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-menu {
  flex: 1;
  padding: 16px 12px;
  margin-top: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.uTools {
    padding-top: 0;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  --level-indent: 14px;
  padding-left: calc(14px + var(--item-level, 0) * var(--level-indent));
  padding-right: 10px;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;

  .active-indicator {
    position: absolute;
    left: 0;
    width: 3px;
    height: 0;
    background: var(--accent-color);
    border-radius: 0 4px 4px 0;
    transition: height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &:hover {
    background: var(--item-hover-bg);
    color: var(--text-primary);
  }

  &.has-actions:hover {
    .item-badge {
      opacity: 0;
      transform: scale(0.8);
    }
    
    .item-actions {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.active {
    background: var(--panel-bg);
    border-color: var(--panel-border);
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
    font-weight: 600;

    .active-indicator {
      height: 16px;
    }

    .item-icon {
      color: var(--accent-color);
    }

    .item-badge {
      background: var(--accent-color);
      color: var(--text-on-accent);
    }
  }

  &.dragging {
    opacity: 0.45;
    background: var(--item-hover-bg);
    border-color: var(--accent-color);
    border-style: dashed;
    box-shadow: none;
    
    .item-badge, .item-actions, .active-indicator, .collapse-toggle {
      opacity: 0 !important;
    }
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;

  .item-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--text-muted);
    transition: color 0.2s;
  }

  .item-name {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
  }
}

.item-right {
  display: flex;
  align-items: center;
  position: relative;
  width: 48px;
  height: 20px;
  justify-content: flex-end;
}

.item-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--badge-bg);
  color: var(--text-secondary);
  transition: all 0.2s;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  right: 0;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  
  &:hover {
    background: var(--item-hover-bg);
    color: var(--text-primary);
  }

  &.delete:hover {
    background: var(--danger-hover-bg);
    color: var(--danger-color);
  }

  .action-icon {
    width: 13px;
    height: 13px;
  }
}

.item-edit-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.item-edit-input {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  color: var(--text-primary);
  width: 100%;
}

.edit-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 6px;
  background: var(--accent-color);
  color: var(--text-on-accent);
  transition: all 0.2s ease;
  
  &.confirm:hover {
    background: var(--accent-hover);
  }

  .btn-icon-small {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 1049px) {
  .sidebar-menu {
    padding: 10px 8px;
    margin-top: 8px;
    gap: 4px;

    &.uTools {
      padding-top: 0;
    }
  }

  .menu-item {
    height: 36px;
    padding-left: calc(10px + var(--item-level, 0) * 10px);
    padding-right: 6px;
  }

  .item-left {
    gap: 8px;
  }
}

.category-list-move {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.menu-divider {
  height: 1px;
  background: color-mix(in srgb, var(--text-primary) 10%, transparent);
  // margin: 6px 4px;
  opacity: 0.8;
}

.trash-item {
  &.active {
    .item-icon {
      color: var(--danger-color, #ff4d4f) !important;
    }
    .item-badge {
      background: var(--danger-color, #ff4d4f) !important;
      color: var(--text-on-accent, #ffffff) !important;
    }
  }
}
</style>
