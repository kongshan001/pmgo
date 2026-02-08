# 任务管理系统

一个简洁高效的任务管理看板应用，采用纯前端技术实现，无需后端服务即可运行。

## 功能特性

- **看板视图**：三列状态管理（待规划、推进中、已完成）
- **拖拽操作**：支持拖拽任务卡片切换状态
- **任务编辑**：点击卡片查看和编辑详细信息
- **优先级标记**：支持高/中/低三级优先级
- **标签管理**：可为任务添加多个标签
- **截止日期**：支持设置任务截止时间，逾期自动高亮
- **本地存储**：数据自动保存到浏览器，刷新不丢失
- **响应式设计**：支持桌面端和移动端访问

## 快速开始

### 方式一：直接打开

直接用浏览器打开 `index.html` 文件即可使用。

```bash
# macOS
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

### 方式二：本地服务器（推荐）

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

然后访问 `http://localhost:8080`

## 使用指南

### 创建任务

1. 点击右上角「+ 新建任务」按钮
2. 填写任务信息（标题为必填）
3. 点击「保存」创建任务

### 管理任务

- **移动状态**：拖拽任务卡片到不同列
- **编辑任务**：点击任务卡片打开编辑窗口
- **删除任务**：在编辑窗口点击「删除」按钮

### 任务属性

| 属性 | 说明 |
|------|------|
| 标题 | 任务名称（必填） |
| 描述 | 任务详细说明 |
| 优先级 | 高/中/低 |
| 截止日期 | 任务截止时间 |
| 标签 | 用逗号分隔的关键词 |

## 技术架构

### 文件结构

```
task-manager/
├── index.html       (92行)   - 页面结构和基础布局
├── styles.css       (369行)  - 全局样式和响应式设计
├── storage.js       (83行)   - localStorage 数据持久化
├── task.js          (78行)   - Task 类定义和数据验证
├── kanban.js        (143行)  - 看板组件（拖拽、渲染）
├── modal.js         (153行)  - 弹窗组件（表单处理）
├── app.js           (13行)   - 应用入口和初始化
└── README.md        - 项目说明文档
```

### 核心技术

- **原生 JavaScript**：无框架依赖，轻量高效
- **localStorage**：浏览器本地存储
- **Drag and Drop API**：原生拖拽实现
- **CSS Grid/Flexbox**：响应式布局
- **CustomEvent**：组件间通信

### 数据模型

```javascript
{
  id: string,           // 唯一标识
  title: string,        // 任务标题
  description: string,  // 任务描述
  status: string,       // todo/progress/done
  priority: string,     // low/medium/high
  dueDate: string,      // 截止日期
  tags: array,          // 标签数组
  createdAt: number,    // 创建时间戳
  updatedAt: number     // 更新时间戳
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 数据备份

所有任务数据存储在浏览器的 localStorage 中，键名为 `task_manager_data`。

如需备份数据，可在浏览器控制台执行：

```javascript
// 导出数据
const data = localStorage.getItem('task_manager_data');
console.log(data);

// 导入数据
localStorage.setItem('task_manager_data', '你的JSON数据');
```

## 注意事项

1. **数据隐私**：所有数据存储在本地浏览器，不会上传到服务器
2. **数据清除**：清除浏览器数据会导致任务丢失，请定期备份
3. **多设备同步**：如需跨设备使用，需手动导出导入数据

## 许可证

MIT License
