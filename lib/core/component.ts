import { VNode } from './vnode';
import { StyleManager } from '../style/StyleManager';
import { TemplateEngine } from './template';
import { reactive } from './reactive';

export abstract class Component {
  private vnode: VNode | null = null;
  private el: HTMLElement | null = null;
  protected styleManager: StyleManager;
  private templateEngine!: TemplateEngine;
  public state: any = {};
  protected mounted = false;
  private childComponents: Component[] = [];

  constructor(protected props: Record<string, any> = {}) {
    this.styleManager = new StyleManager();
    this.state = reactive(this.initState() ?? {});
    this.initStyles();
    this.templateEngine = new TemplateEngine(this.state);

    // 监听状态变化，触发重新渲染
    const proxyHandler = {
      set: (target: any, key: string, value: any) => {
        const result = Reflect.set(target, key, value);
        if (result && this.mounted) {
          this.update();
        }
        return result;
      }
    };

    this.state = new Proxy(this.state, proxyHandler);
  }

  protected abstract initState(): object;
  protected abstract initStyles(): void;
  protected abstract render(): VNode;

  public mount(container: HTMLElement): void {
    try {
      this.vnode = this.render();
      this.el = this.createDOM(this.vnode);
      container.appendChild(this.el);
      this.mounted = true;
    } catch (error) {
      console.error('组件渲染错误:', error);
    }
  }

  protected update(): void {
    if (!this.el || !this.vnode) return;
    
    const newVNode = this.render();
    const newEl = this.createDOM(newVNode);
    
    this.templateEngine.clearBindings();
    
    this.el.parentElement?.replaceChild(newEl, this.el);
    this.vnode = newVNode;
    this.el = newEl;
  }

  private createDOM(vnode: VNode ): HTMLElement {
    // 处理组件类型
    if (vnode.component) {
      const componentInstance = new vnode.component(vnode.props ?? {});
      this.childComponents.push(componentInstance);
      const componentVNode = componentInstance.render();
      return this.createDOM(componentVNode);
    }

    // 处理普通 HTML 元素
    if (vnode.tag) {
      const el = document.createElement(vnode.tag);
      if (vnode.props) {
        Object.entries(vnode.props).forEach(([key, value]) => {
          el.setAttribute(key, value);
        });
      }

      if (vnode.listeners) {
        Object.entries(vnode.listeners).forEach(([event, handler]) => {
          el.addEventListener(event, handler);
        });
      }

      vnode.children?.forEach(child => {
        if (typeof child === 'string') {
          const textNode = this.templateEngine.parseTemplate(child);
          el.appendChild(textNode);
        } else if (child) {
          el.appendChild(this.createDOM(child));
        }
      });

      return el;
    }
    
    throw new Error('VNode must have either tag or component property');
  }

  protected get router() {
    return (globalThis as any).__APP__?.router;
  }

  public unmount(): void {
    // 先卸载所有子组件
    this.childComponents.forEach(child => child.unmount());
    this.childComponents = [];
    
    // 清理事件监听器
    this.templateEngine.clearBindings();
    // 清理样式
    this.styleManager.clearStyles();
    // 从 DOM 中移除元素
    if (this.el && this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
      this.el = null;
    }
    this.mounted = false;
  }
}