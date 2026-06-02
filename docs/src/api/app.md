# 应用 API

本文档介绍 Free-JS 应用实例的 API。

## createApp

`createApp` 函数用于创建应用实例：

```typescript
import { createApp } from 'free-js';

const app = createApp({
  rootElement: '#app',
  state: {
    appName: 'My App'
  },
  config: {
    debug: true,
    enableDevTools: true
  }
});
```

### 参数

- `options`: 应用配置选项
  - `rootElement`: 应用挂载的 DOM 元素选择器或元素
  - `state`: 全局状态（可选）
  - `config`: 应用配置（可选）

### 返回值

返回应用实例对象。

## 应用实例方法

### mount

挂载应用到指定的 DOM 元素：

```typescript
app.mount();
```

### unmount

卸载应用：

```typescript
app.unmount();
```

### use

使用插件：

```typescript
import { createRouter } from 'free-js/router';

const router = createRouter({
  routes: [...]
});

app.use(router);
```

### onMounted

注册应用挂载完成后的回调：

```typescript
app.onMounted(() => {
  console.log('App mounted');
});
```

### onUnmounted

注册应用卸载完成后的回调：

```typescript
app.onUnmounted(() => {
  console.log('App unmounted');
});
```

### updateRootComponent

更新根组件：

```typescript
import { HomeComponent } from './components/HomeComponent';

app.updateRootComponent(HomeComponent);
```

### getState

获取全局状态：

```typescript
const state = app.getState();
console.log(state.appName);
```

### setState

设置全局状态：

```typescript
app.setState({
  appName: 'Updated App'
});
```

### clearState

清除全局状态：

```typescript
app.clearState();
```

## 应用实例属性

### rootElement

应用挂载的 DOM 元素：

```typescript
console.log(app.rootElement);
```

### state

应用的全局状态：

```typescript
console.log(app.state);
```

### config

应用的配置：

```typescript
console.log(app.config);
```

### isMounted

应用是否已挂载：

```typescript
console.log(app.isMounted);
```

## 插件系统

### 创建插件

插件是一个具有 `install` 方法的对象：

```typescript
const myPlugin = {
  install(app, options) {
    // 扩展应用实例
    app.myMethod = () => {
      console.log('My plugin method');
    };

    // 注册全局组件
    app.component('MyComponent', MyComponent);

    // 注册全局指令
    app.directive('my-directive', (el, binding) => {
      // 指令逻辑
    });
  }
};

// 使用插件
app.use(myPlugin, { /* 插件选项 */ });
```

### 路由插件

Free-JS 内置了路由插件：

```typescript
import { createRouter } from 'free-js/router';

const router = createRouter({
  routes: [
    {
      path: '/',
      component: HomeComponent
    },
    {
      path: '/about',
      component: AboutComponent
    }
  ]
});

app.use(router);
```

## 示例

### 完整应用示例

```typescript
import { createApp } from 'free-js';
import { createRouter } from 'free-js/router';
import { HomeComponent } from './components/HomeComponent';
import { AboutComponent } from './components/AboutComponent';

// 创建路由实例
const router = createRouter({
  routes: [
    {
      path: '/',
      component: HomeComponent
    },
    {
      path: '/about',
      component: AboutComponent
    }
  ]
});

// 创建应用实例
const app = createApp({
  rootElement: '#app',
  state: {
    appName: 'Free-JS Demo',
    version: '1.0.0'
  }
});

// 使用路由插件
app.use(router);

// 注册生命周期回调
app.onMounted(() => {
  console.log('App mounted successfully!');
});

app.onUnmounted(() => {
  console.log('App unmounted successfully!');
});

// 挂载应用
app.mount();

// 导出应用实例
(window as any).app = app;
```

## 总结

应用 API 提供了创建和管理 Free-JS 应用的核心功能，包括应用的挂载、卸载、插件使用等。通过理解和掌握这些 API，您可以创建更加复杂、功能丰富的应用。
