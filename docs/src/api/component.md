# 组件 API

本文档介绍 Free-JS 组件的 API。

## Component 类

`Component` 是 Free-JS 中所有组件的基类，您需要继承此类来创建自定义组件：

```typescript
import { Component } from 'free-js';

class MyComponent extends Component {
  protected initState() {
    return {
      message: 'Hello, Free-JS!'
    };
  }

  protected initStyles() {
    // 初始化样式
  }

  protected render() {
    return {
      tag: 'div',
      children: [`{{message}}`]
    };
  }
}
```

## 组件生命周期钩子

### 挂载阶段

- `beforeMount()`: 组件挂载到 DOM 前调用
- `onMounted()`: 组件挂载到 DOM 后调用

### 更新阶段

- `beforeUpdate()`: 组件状态更新前调用
- `onUpdated()`: 组件状态更新后调用

### 卸载阶段

- `beforeUnmount()`: 组件从 DOM 卸载前调用
- `onUnmounted()`: 组件从 DOM 卸载后调用

## 组件方法

### initState

初始化组件状态：

```typescript
protected initState() {
  return {
    count: 0,
    user: {
      name: 'John',
      age: 30
    }
  };
}
```

### initStyles

初始化组件样式：

```typescript
protected initStyles() {
  this.styleManager.addStyle('.container', {
    selector: '.container',
    properties: {
      padding: '20px',
      backgroundColor: '#f0f0f0'
    }
  });
}
```

### render

渲染组件，返回虚拟 DOM 节点：

```typescript
protected render() {
  return {
    tag: 'div',
    props: { className: 'container' },
    children: [
      { tag: 'h1', children: [`Count: {{count}}`] },
      {
        tag: 'button',
        listeners: { click: () => this.state.count++ },
        children: ['Increment']
      }
    ]
  };
}
```

### mount

挂载组件到指定的 DOM 元素：

```typescript
const component = new MyComponent();
component.mount(document.getElementById('app'));
```

### unmount

卸载组件：

```typescript
component.unmount();
```

### update

更新组件：

```typescript
component.update();
```

### emit

发射事件：

```typescript
this.emit('custom-event', 'event data');
```

### on

监听事件：

```typescript
component.on('custom-event', (data) => {
  console.log('Event received:', data);
});
```

### off

移除事件监听器：

```typescript
const handler = (data) => {
  console.log('Event received:', data);
};

component.on('custom-event', handler);
component.off('custom-event', handler);
```

### provide

提供数据给子组件：

```typescript
protected initState() {
  this.provide('user', {
    name: 'John',
    age: 30
  });
  return {};
}
```

### inject

注入父组件提供的数据：

```typescript
protected initState() {
  const user = this.inject('user');
  return {
    user
  };
}
```

### getContext

获取应用上下文：

```typescript
protected getContext() {
  return (globalThis as any).__APP__?.context;
}
```

### router

获取路由实例：

```typescript
protected get router() {
  return (globalThis as any).__APP__?.router;
}

protected navigateToAbout() {
  this.router.push('/about');
}
```

## 组件属性

### props

组件属性：

```typescript
class ButtonComponent extends Component {
  protected render() {
    const { text, disabled = false } = this.props;
    return {
      tag: 'button',
      props: { disabled },
      children: [text]
    };
  }
}
```

### state

组件状态：

```typescript
class CounterComponent extends Component {
  protected initState() {
    return { count: 0 };
  }

  protected render() {
    return {
      tag: 'div',
      children: [`Count: ${this.state.count}`]
    };
  }
}
```

### styleManager

样式管理器：

```typescript
this.styleManager.addStyle('.button', {
  selector: '.button',
  properties: {
    padding: '8px 16px',
    backgroundColor: '#007bff'
  }
});
```

### mounted

组件是否已挂载：

```typescript
if (this.mounted) {
  console.log('Component is mounted');
}
```

## 虚拟 DOM

### 元素节点

```typescript
{
  tag: 'div',
  props: { className: 'container' },
  listeners: {
    click: () => console.log('clicked')
  },
  children: [
    'Hello World',
    {
      tag: 'button',
      children: ['Click Me']
    }
  ]
}
```

### 组件节点

```typescript
{
  component: MyComponent,
  props: {
    title: 'My Component'
  },
  listeners: {
    'custom-event': (data) => console.log(data)
  }
}
```

## 示例

### 完整组件示例

```typescript
import { Component } from 'free-js';

class CounterComponent extends Component {
  protected initState() {
    return {
      count: 0
    };
  }

  protected initStyles() {
    this.styleManager.addStyle('.counter', {
      selector: '.counter',
      properties: {
        textAlign: 'center',
        padding: '20px'
      }
    });

    this.styleManager.addStyle('.counter button', {
      selector: '.counter button',
      properties: {
        padding: '8px 16px',
        margin: '0 5px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }
    });
  }

  protected beforeMount() {
    console.log('Component will mount');
  }

  protected onMounted() {
    console.log('Component mounted');
  }

  protected beforeUpdate() {
    console.log('Component will update');
  }

  protected onUpdated() {
    console.log('Component updated');
  }

  protected beforeUnmount() {
    console.log('Component will unmount');
  }

  protected onUnmounted() {
    console.log('Component unmounted');
  }

  protected increment() {
    this.state.count++;
    this.emit('increment', this.state.count);
  }

  protected decrement() {
    this.state.count--;
    this.emit('decrement', this.state.count);
  }

  protected render() {
    return {
      tag: 'div',
      props: { className: 'counter' },
      children: [
        { tag: 'h1', children: [`Count: {{count}}`] },
        {
          tag: 'div',
          children: [
            {
              tag: 'button',
              listeners: { click: () => this.decrement() },
              children: ['-']
            },
            {
              tag: 'button',
              listeners: { click: () => this.increment() },
              children: ['+']
            }
          ]
        }
      ]
    };
  }
}

// 使用组件
const counter = new CounterComponent();
counter.on('increment', (count) => {
  console.log('Count incremented to:', count);
});
counter.mount(document.getElementById('app'));
```

## 总结

组件 API 提供了创建和管理组件的核心功能，包括生命周期管理、状态管理、样式管理、事件处理等。通过理解和掌握这些 API，您可以创建更加复杂、功能丰富的组件。
