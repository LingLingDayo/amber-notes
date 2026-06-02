# 🧩 公共组件目录 (Common Components)

此目录专门用于存放全局通用的公共 UI 组件（例如通用的按钮、输入框、下拉菜单、弹窗骨架等）。

*   **业务组件**：请存放在 `src/modules/` 目录下（如 `ActionBar`、`CategorySidebar`、`NoteCard` 等与便签业务强相关的组件）。
*   **规范**：公共组件应尽量保持无副作用、高内聚、低耦合，通过 props 和 events 与外部进行数据交互。
