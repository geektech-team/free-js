import { Component } from './component';
import { Router } from '../router';

import { TemplateEngine } from './template';

export interface AppOptions {
  /** 根组件构造函数 */
  root?: new () => Component;
  /** 应用挂载点 */
  rootElement?: string | Element;
  /** 全局状态 */
  state?: Record<string, any>;
  /** 全局配置 */
  config?: Record<string, any>;
}

export interface AppContext {
  app: FreeApp;
  version: string;
  config: Record<string, any>;
}

export class FreeApp {
  private container: HTMLElement;
  private rootInstance: Component | null = null;
  private mounted: boolean = false;
  private templateEngine: TemplateEngine | null = null;
  private readonly appContext: AppContext;
  private plugins: Array<{ plugin: any; args: any[] }> = [];
  private unmountedCallback?: () => void;
  public router?: Router;

  constructor(private options: AppOptions = {}) {
    // 默认使用 body 作为容器
    this.container = document.body;

    this.appContext = {
      app: this,
      version: '1.0.0',
      config: options.config || {},
    };
  }

  private handleError(error: Error): void {
    console.error('应用错误:', error);
    // 可以在这里添加错误UI渲染
    this.unmount();
  }

  /**
   * 使用插件
   */
  public use(plugin: any, ...args: any[]): this {
    plugin.install(this, ...args);
    this.plugins.push({ plugin, args });
    return this;
  }

  /**
   * 挂载应用
   */
  public mount(): void {
    if (this.mounted) {
      console.warn('应用已经处于运行状态');
      return;
    }

    try {
      (globalThis as any).__APP__ = this;

      // 确定挂载点
      if (this.options.rootElement) {
        const rootElement = this.resolveRootElement(this.options.rootElement);
        if (rootElement) {
          this.container = rootElement as HTMLElement;
        }
      }

      // 只有在有根组件时才创建实例
      if (this.options.root) {
        this.rootInstance = new this.options.root();

        // 设置应用上下文
        if ('setAppContext' in this.rootInstance) {
          (this.rootInstance as any).setAppContext(this.appContext);
        }

        // 如果有全局状态，传递给组件
        if (this.options.state && 'setState' in this.rootInstance) {
          (this.rootInstance as any).setState(this.options.state);
        }

        this.rootInstance.mount(this.container);

        // 创建模板引擎实例
        this.templateEngine = new TemplateEngine(this.options.state || {});
      }

      this.mounted = true;

      // 触发生命周期钩子
      this.onMounted();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * 卸载应用
   */
  public unmount(): void {
    if (!this.mounted) {
      console.warn('应用未处于运行状态');
      return;
    }

    try {
      // 触发卸载前钩子
      this.onBeforeUnmount();

      if (this.rootInstance) {
        this.container.innerHTML = '';

        // 调用组件卸载方法
        if ('unmount' in this.rootInstance) {
          this.rootInstance.unmount();
        }

        this.rootInstance = null;
        this.mounted = false;
        delete (globalThis as any).__APP__;
      }

      // 清除模板引擎
      if (this.templateEngine) {
        this.templateEngine.clearBindings();
        this.templateEngine = null;
      }

      // 触发卸载后钩子
      if (this.unmountedCallback) {
        this.unmountedCallback();
      }
    } catch (error) {
      console.error('Failed to unmount app:', error);
    }
  }

  /**
   * 应用是否正在运行
   */
  public isRunning(): boolean {
    return this.mounted;
  }

  /**
   * 更新根组件
   */
  public updateRootComponent(component: new () => Component): void {
    if (this.mounted) {
      this.unmount();
    }
    this.options.root = component;
    this.mount();
  }

  /**
   * 更新应用状态
   */
  public update(state?: Record<string, any>): this {
    if (!this.mounted) {
      console.warn('Cannot update unmounted app');
      return this;
    }

    try {
      // 更新状态
      if (state && this.options.state) {
        this.options.state = { ...this.options.state, ...state };

        // 更新组件状态
        if (this.rootInstance && 'setState' in this.rootInstance) {
          (this.rootInstance as any).setState(state);
        }

        // 更新模板引擎状态
        if (this.templateEngine) {
          // 如果存在templateEngine，更新其状态
          (this.templateEngine as any).state = state;
        }
      }

      // 触发更新钩子
      this.onUpdated();
    } catch (error) {
      console.error('Failed to update app:', error);
    }

    return this;
  }

  /**
   * 获取应用上下文
   */
  public getContext(): AppContext {
    return this.appContext;
  }

  /**
   * 获取应用状态
   */
  public getState(): Record<string, any> | undefined {
    return this.options.state;
  }

  /**
   * 设置应用状态
   */
  public setState(newState: Record<string, any>): this {
    this.options.state = { ...this.options.state, ...newState };
    if (this.mounted) {
      this.update();
    }
    return this;
  }

  /**
   * 监听应用卸载
   */
  public onUnmounted(callback: () => void): this {
    this.unmountedCallback = callback;
    return this;
  }

  /**
   * 解析根元素
   */
  private resolveRootElement(selector?: string | Element): Element | null {
    if (!selector) {
      return null;
    }

    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }

    return selector instanceof Element ? selector : null;
  }

  // 生命周期钩子
  private onMounted(): void {
    // 触发插件的mounted钩子
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onMounted === 'function') {
        pluginObj.onMounted(this);
      }
    });
  }

  private onUpdated(): void {
    // 触发插件的updated钩子
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onUpdated === 'function') {
        pluginObj.onUpdated(this);
      }
    });
  }

  private onBeforeUnmount(): void {
    // 触发插件的beforeUnmount钩子
    this.plugins.forEach(({ plugin: pluginObj }) => {
      if (pluginObj && typeof pluginObj.onBeforeUnmount === 'function') {
        pluginObj.onBeforeUnmount(this);
      }
    });
  }
}

/**
 * 创建应用实例
 */
export function createApp(options: AppOptions = {}): FreeApp {
  return new FreeApp(options);
}