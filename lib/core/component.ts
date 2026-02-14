import type { VNode } from './vnode';
import { StyleManager } from '../style/StyleManager';
import { TemplateEngine } from './template';
import { reactive, effect } from './reactive';

export interface ComponentProps {
  [key: string]: any;
}

export abstract class Component<T extends ComponentProps = ComponentProps> {
  private vnode: VNode | null = null;
  private el: HTMLElement | null = null;
  protected styleManager: StyleManager;
  private templateEngine!: TemplateEngine;
  public state: any = {};
  protected mounted = false;
  private childComponents: Component[] = [];
  private eventListeners: Record<string, Set<Function>> = {};
  private static provideData: Record<string, any> = {};

  constructor(protected props: T = {} as T) {
    this.styleManager = new StyleManager();
    this.state = reactive(this.initState() ?? {});
    this.initStyles();
    this.templateEngine = new TemplateEngine(this.state);

    // 监听状态变化，触发重新渲染
    effect(() => {
      // 访问所有状态属性以建立依赖关系
      this.trackStateProperties();
      // 当状态变化且组件已挂载时，触发更新
      if (this.mounted) {
        this.update();
      }
    });
  }

  /**
   * 发射事件
   */
  protected emit(eventName: string, ...args: any[]): void {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(...args);
      });
    }
  }

  /**
   * 监听事件
   */
  public on(eventName: string, listener: Function): void {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = new Set();
    }
    this.eventListeners[eventName].add(listener);
  }

  /**
   * 移除事件监听器
   */
  public off(eventName: string, listener: Function): void {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].delete(listener);
    }
  }

  /**
   * 提供数据给子组件
   */
  protected provide(key: string, value: any): void {
    Component.provideData[key] = value;
  }

  /**
   * 注入父组件提供的数据
   */
  protected inject<T>(key: string, defaultValue?: T): T | undefined {
    return Component.provideData[key] ?? defaultValue;
  }

  /**
   * 解析事件名称和修饰符
   */
  private parseEventName(event: string): {
    eventName: string;
    modifiers: Set<string>;
  } {
    const parts = event.split('.');
    const eventName = parts[0];
    const modifiers = new Set(parts.slice(1));
    return { eventName, modifiers };
  }

  /**
   * 包装事件处理器，添加修饰符功能
   */
  private wrapEventHandler(
    handler: Function,
    modifiers: Set<string>
  ): EventListener {
    const eventHandler = function (event: Event) {
      // 处理修饰符
      if (modifiers.has('stop')) {
        event.stopPropagation();
      }

      if (modifiers.has('prevent')) {
        event.preventDefault();
      }

      if (modifiers.has('self') && event.currentTarget !== event.target) {
        return;
      }

      if (modifiers.has('once')) {
        (event.currentTarget as EventTarget).removeEventListener(
          event.type,
          eventHandler
        );
      }

      // 执行原始处理器
      handler(event);
    };
    return eventHandler;
  }

  /**
   * 追踪状态属性，建立依赖关系
   * 注意：这是一个简化实现，实际项目中可能需要更复杂的追踪策略
   */
  private trackStateProperties(): void {
    if (typeof this.state === 'object' && this.state !== null) {
      // 遍历所有自有属性以建立依赖
      Object.keys(this.state).forEach((key) => {
        // 访问属性以触发依赖收集
        (this.state as any)[key];
      });
    }
  }

  protected abstract initState(): object;
  protected abstract initStyles(): void;
  protected abstract render(): VNode;

  public mount(container: HTMLElement): void {
    try {
      if (!container || !(container instanceof HTMLElement)) {
        throw new Error('Invalid container element');
      }

      // 调用beforeMount钩子
      this.beforeMount();

      this.vnode = this.render();
      this.el = this.createDOM(this.vnode);
      container.appendChild(this.el);
      this.mounted = true;

      // 调用生命周期钩子
      this.onMounted();
    } catch (error) {
      console.error('组件渲染错误:', error);
      throw error;
    }
  }

  protected update(): void {
    if (!this.el || !this.vnode) return;

    try {
      // 调用beforeUpdate钩子
      this.beforeUpdate();

      const newVNode = this.render();

      // 使用patch方法更新DOM，而不是直接替换
      this.patch(this.vnode, newVNode, this.el);
      this.vnode = newVNode;

      // 调用生命周期钩子
      this.onUpdated();
    } catch (error) {
      console.error('组件更新错误:', error);
    }
  }

  /**
   * 比较新旧VNode并更新DOM
   */
  private patch(oldVNode: VNode, newVNode: VNode, el: HTMLElement): void {
    // 处理组件类型
    if ('component' in oldVNode && 'component' in newVNode) {
      // 组件更新逻辑
      return;
    }

    // 处理HTML元素
    if ('tag' in oldVNode && 'tag' in newVNode) {
      // 比较标签是否相同
      if (oldVNode.tag !== newVNode.tag) {
        // 标签不同，直接替换
        const newEl = this.createDOM(newVNode);
        if (el.parentElement) {
          el.parentElement.replaceChild(newEl, el);
          this.el = newEl;
        }
        return;
      }

      // 更新属性
      this.updateProps(el, oldVNode.props || {}, newVNode.props || {});

      // 更新事件监听器
      this.updateListeners(
        el,
        oldVNode.listeners || {},
        newVNode.listeners || {}
      );

      // 更新子节点
      this.updateChildren(el, oldVNode.children || [], newVNode.children || []);

      return;
    }

    // 其他情况，直接替换
    const newEl = this.createDOM(newVNode);
    if (el.parentElement) {
      el.parentElement.replaceChild(newEl, el);
      this.el = newEl;
    }
  }

  /**
   * 更新元素属性
   */
  private updateProps(
    el: HTMLElement,
    oldProps: Record<string, any>,
    newProps: Record<string, any>
  ): void {
    // 移除旧属性
    Object.keys(oldProps).forEach((key) => {
      if (!(key in newProps)) {
        if (key === 'className') {
          el.className = '';
        } else if (key === 'style' && typeof oldProps[key] === 'object') {
          el.removeAttribute('style');
        } else if (key === 'v-show') {
          // 移除v-show指令，恢复默认显示
          el.style.display = '';
        } else {
          el.removeAttribute(key);
        }
      }
    });

    // 添加或更新新属性
    Object.entries(newProps).forEach(([key, value]) => {
      if (key === 'v-show') {
        // 处理v-show指令
        el.style.display = value ? '' : 'none';
      } else if (
        (key !== 'className' && key !== 'style' && typeof value === 'string') ||
        typeof value === 'number'
      ) {
        el.setAttribute(key, String(value));
      } else if (key === 'className') {
        el.className = String(value);
      } else if (
        key === 'style' &&
        typeof value === 'object' &&
        value !== null
      ) {
        Object.entries(value).forEach(([cssKey, cssValue]) => {
          (el.style as any)[cssKey] = cssValue;
        });
      }
    });
  }

  /**
   * 更新事件监听器
   */
  private updateListeners(
    el: HTMLElement,
    oldListeners: Record<string, Function>,
    newListeners: Record<string, Function>
  ): void {
    // 移除旧监听器
    Object.keys(oldListeners).forEach((event) => {
      if (!(event in newListeners)) {
        el.removeEventListener(event, oldListeners[event]);
      }
    });

    // 添加或更新新监听器
    Object.entries(newListeners).forEach(([event, handler]) => {
      if (oldListeners[event] !== handler) {
        if (oldListeners[event]) {
          el.removeEventListener(event, oldListeners[event]);
        }
        el.addEventListener(event, handler);
      }
    });
  }

  /**
   * 更新子节点
   */
  private updateChildren(
    el: HTMLElement,
    oldChildren: Array<VNode | string>,
    newChildren: Array<VNode | string>
  ): void {
    const oldLength = oldChildren.length;
    const newLength = newChildren.length;
    const minLength = Math.min(oldLength, newLength);

    // 更新公共部分的子节点
    for (let i = 0; i < minLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];

      if (typeof oldChild === 'string' && typeof newChild === 'string') {
        // 两个都是文本节点
        const textNode = el.childNodes[i] as Text;
        if (textNode && oldChild !== newChild) {
          textNode.textContent = newChild;
        }
      } else if (typeof oldChild === 'object' && typeof newChild === 'object') {
        // 两个都是VNode
        const childEl = el.childNodes[i] as HTMLElement;
        if (childEl) {
          this.patch(oldChild, newChild, childEl);
        }
      } else {
        // 类型不同，替换
        const newChildEl = this.createDOM(newChild as VNode);
        const oldChildEl = el.childNodes[i];
        if (oldChildEl) {
          el.replaceChild(newChildEl, oldChildEl);
        } else {
          el.appendChild(newChildEl);
        }
      }
    }

    // 添加新的子节点
    if (newLength > oldLength) {
      for (let i = oldLength; i < newLength; i++) {
        const newChildEl = this.createDOM(newChildren[i] as VNode);
        el.appendChild(newChildEl);
      }
    }

    // 移除多余的子节点
    if (newLength < oldLength) {
      for (let i = oldLength - 1; i >= newLength; i--) {
        el.removeChild(el.childNodes[i]);
      }
    }
  }

  private createDOM(vnode: VNode, context?: Component): HTMLElement {
    // 处理组件类型
    if ('component' in vnode) {
      const componentInstance = new vnode.component(vnode.props ?? {});

      // 处理事件监听器
      if (vnode.emitters) {
        Object.entries(vnode.emitters).forEach(([eventName, handler]) => {
          componentInstance.on(eventName, handler);
        });
      }

      this.childComponents.push(componentInstance);
      const componentVNode = componentInstance.render();
      return this.createDOM(componentVNode, this);
    }

    // 处理普通 HTML 元素
    if ('tag' in vnode) {
      // 处理插槽
      if (
        vnode.tag === 'slot' &&
        'props' in vnode &&
        vnode.props?.name &&
        context
      ) {
        return this.handleSlot(vnode.props.name);
      }

      // 处理v-if指令
      if (vnode.props && 'v-if' in vnode.props && !vnode.props['v-if']) {
        return document.createComment('v-if');
      }

      const el = document.createElement(vnode.tag);

      // 处理v-show指令
      if (vnode.props && 'v-show' in vnode.props) {
        el.style.display = vnode.props['v-show'] ? '' : 'none';
      }

      if ('props' in vnode && vnode.props) {
        Object.entries(vnode.props).forEach(([key, value]) => {
          if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value);
          } else if (key === 'className') {
            el.className = String(value);
          } else if (
            key === 'style' &&
            typeof value === 'object' &&
            value !== null
          ) {
            Object.entries(value).forEach(([cssKey, cssValue]) => {
              (el.style as any)[cssKey] = cssValue;
            });
          } else if (key === 'v-model' && typeof value === 'string') {
            // 处理双向绑定
            this.setupTwoWayBinding(el, value);
          } else if (typeof value === 'string') {
            // 检查属性值是否包含模板表达式
            if (this.templateEngine.hasExpressions(value)) {
              // 创建响应式属性绑定
              this.setupReactiveAttribute(el, key, value);
            } else {
              el.setAttribute(key, value);
            }
          } else if (typeof value === 'number') {
            el.setAttribute(key, String(value));
          }
        });
      }

      if ('listeners' in vnode && vnode.listeners) {
        Object.entries(vnode.listeners).forEach(([event, handler]) => {
          if (typeof handler === 'function' || typeof handler === 'object') {
            // 处理事件修饰符
            const { eventName, modifiers } = this.parseEventName(event);
            const wrappedHandler = this.wrapEventHandler(
              handler as Function,
              modifiers
            );
            el.addEventListener(eventName, wrappedHandler);
          }
        });
      }

      if ('children' in vnode && vnode.children) {
        vnode.children.forEach((child: any) => {
          if (typeof child === 'string') {
            const textNode = this.templateEngine.parseTemplate(child);
            el.appendChild(textNode);
          } else if (child) {
            el.appendChild(this.createDOM(child));
          }
        });
      }

      return el;
    }

    throw new Error('VNode must have either tag or component property');
  }

  private handleSlot(slotName: string): HTMLElement {
    // 创建一个容器来放置插槽内容
    const slotContainer = document.createElement('div');
    slotContainer.setAttribute('data-slot', slotName);
    return slotContainer;
  }

  // 生命周期钩子
  protected beforeMount(): void {
    // 可被子类重写
  }

  protected onMounted(): void {
    // 可被子类重写
  }

  protected beforeUpdate(): void {
    // 可被子类重写
  }

  protected onUpdated(): void {
    // 可被子类重写
  }

  protected beforeUnmount(): void {
    // 可被子类重写
  }

  protected onUnmounted(): void {
    // 可被子类重写
  }

  public unmount(): void {
    // 调用beforeUnmount钩子
    this.beforeUnmount();

    // 先卸载所有子组件
    this.childComponents.forEach((child) => child.unmount());
    this.childComponents = [];

    // 清理事件监听器和模板绑定
    this.templateEngine.clearBindings();

    // 清理样式
    this.styleManager.clearStyles();

    // 从 DOM 中移除元素
    if (this.el && this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
      this.el = null;
    }

    this.mounted = false;
    this.vnode = null;

    // 调用onUnmounted钩子
    this.onUnmounted();
  }

  // 提供上下文访问
  protected getContext(): any {
    // 可以扩展为提供全局上下文
    return null;
  }

  // 提供路由访问
  protected get router() {
    return (globalThis as any).__APP__?.router;
  }

  /**
   * 设置响应式属性绑定
   */
  private setupReactiveAttribute(
    el: HTMLElement,
    attrName: string,
    attrValue: string
  ): void {
    // 使用模板引擎解析属性值
    effect(() => {
      // 计算模板值
      const value = this.templateEngine.evaluateTemplateValue(attrValue);

      // 设置属性值
      el.setAttribute(attrName, value);
    });
  }

  /**
   * 设置双向绑定
   */
  private setupTwoWayBinding(el: HTMLElement, modelKey: string): void {
    // 获取状态值
    const getValue = () => {
      const keys = modelKey.split('.');
      let value = this.state;
      for (const key of keys) {
        if (value === undefined || value === null) {
          return '';
        }
        value = value[key];
      }
      return value === undefined || value === null ? '' : String(value);
    };

    // 设置状态值
    const setValue = (value: any) => {
      const keys = modelKey.split('.');
      let target = this.state;

      // 遍历到倒数第二个键
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (target[key] === undefined) {
          target[key] = {};
        }
        target = target[key];
      }

      // 设置最后一个键的值
      target[keys[keys.length - 1]] = value;
    };

    // 初始设置值
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      el.value = getValue();
    }

    // 监听元素事件
    const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventName, (e) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        setValue(el.value);
      } else if (el instanceof HTMLSelectElement) {
        setValue(el.value);
      }
    });

    // 监听状态变化
    effect(() => {
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        const currentValue = getValue();
        if (el.value !== currentValue) {
          el.value = currentValue;
        }
      }
    });
  }
}