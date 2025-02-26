import { Component } from './component';
import { Router } from '../router';

export interface AppOptions {
  root?: new () => Component;
}

export class FreeApp {
  private container: HTMLElement;
  private rootInstance: Component | null = null;
  private mounted: boolean = false;
  public router?: Router;

  constructor(private options: AppOptions = {}) {
    // 默认使用 body 作为容器
    this.container = document.body;
  }

  private handleError(error: Error): void {
    console.error('应用错误:', error);
    // 可以在这里添加错误UI渲染
    this.unmount();
  }

  public mount(): void {
    if (this.mounted) {
      console.warn('应用已经处于运行状态');
      return;
    }

    try {
      (globalThis as any).__APP__ = this;
      
      // 只有在有根组件时才创建实例
      if (this.options.root) {
        this.rootInstance = new this.options.root();
        this.rootInstance.mount(this.container);
      }
      this.mounted = true;
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  public unmount(): void {
    if (!this.mounted) {
      console.warn('应用未处于运行状态');
      return;
    }

    if (this.rootInstance) {
      this.container.innerHTML = '';
      this.rootInstance = null;
      this.mounted = false;
      delete (globalThis as any).__APP__;
    }
  }

  public use(plugin: { install: (app: FreeApp) => void }): this {
    plugin.install(this);
    return this;
  }

  public isRunning(): boolean {
    return this.mounted;
  }

  public updateRootComponent(component: new () => Component): void {
    if (this.mounted) {
      this.unmount();
    }
    this.options.root = component;
    this.mount();
  }
}