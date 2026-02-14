# Free-JS

轻量级纯TypeScript前端框架，提供响应式系统、组件化和路由功能。

## 特性

- ✨ 纯TypeScript实现，提供完整的类型支持
- ⚡ 高效的响应式系统
- 🧩 组件化开发模式
- 🛣️ 内置路由功能
- 💅 样式管理系统
- 📦 轻量级设计，无外部依赖

## 安装

```bash
# 使用npm
npm install free-js

# 使用yarn
yarn add free-js

# 使用pnpm
pnpm add free-js
```

## 快速开始

### 创建应用

```typescript
import { createApp, Component, reactive } from 'free-js';

// 创建一个简单的组件
class App extends Component {
  protected initState() {
    return {
      count: 0
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.app', {
      selector: '.app',
      properties: {
        textAlign: 'center',
        padding: '20px'
      }
    });
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'app' },
      children: [
        {
          tag: 'h1',
          children: [`计数: {{count}}`]
        },
        {
          tag: 'button',
          props: { className: 'btn' },
          listeners: {
            click: () => this.state.count++
          },
          children: ['增加计数']
        }
      ]
    };
  }
}

// 创建并挂载应用
const app = createApp({ root: App });
app.mount();
```

## 响应式系统

```typescript
import { reactive, effect } from 'free-js';

const state = reactive({
  name: 'Free-JS',
  version: '0.0.1'
});

effect(() => {
  console.log(`${state.name} v${state.version}`);
});

// 当状态改变时，effect会自动重新执行
state.version = '0.0.2'; // 输出: Free-JS v0.0.2
```

## 组件系统

### 基本组件

```typescript
import { Component } from 'free-js';

class MyComponent extends Component {
  protected initState() {
    return {
      message: 'Hello, Free-JS!'
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.my-component', {
      selector: '.my-component',
      properties: {
        color: '#333',
        fontSize: '16px'
      }
    });
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'my-component' },
      children: [`{{message}}`]
    };
  }
}
```

### 组件嵌套

```typescript
class ParentComponent extends Component {
  protected render() {
    return {
      tag: 'div',
      children: [
        {
          tag: 'h2',
          children: ['父组件']
        },
        {
          component: ChildComponent,
          props: {
            title: '子组件'
          }
        }
      ]
    };
  }
}
```

## 路由系统

```typescript
import { createApp } from 'free-js';
import { createRouter } from 'free-js/router';

// 创建路由实例
const router = createRouter([
  {
    path: '/',
    component: HomeComponent
  },
  {
    path: '/about',
    component: AboutComponent
  }
]);

// 创建应用并使用路由插件
const app = createApp({ root: App });
app.use(router);
app.mount();
```

## API 参考

### createApp(options)

创建应用实例。

- **options**: 应用配置
  - **root**: 根组件类

### Component

组件基类，所有自定义组件都应继承此类。

- **initState()**: 初始化组件状态
- **initStyles()**: 初始化组件样式
- **render()**: 渲染组件，返回虚拟DOM节点
- **mount(container)**: 挂载组件到DOM
- **update()**: 更新组件

### reactive(target)

创建响应式对象。

- **target**: 要转换的对象
- **返回值**: 响应式代理对象

### effect(fn)

创建副作用函数。

- **fn**: 副作用函数

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

[MIT](LICENSE)
