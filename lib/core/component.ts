import { VNode } from './vnode';
import { StyleManager } from '../style/StyleManager';
import { TemplateEngine } from './template';
import { reactive } from './reactive';
export abstract class Component {
  private vnode: VNode | null = null;
  private el: HTMLElement | null = null;
  protected styleManager: StyleManager;
  private templateEngine!: TemplateEngine;
  protected state: any = {};
  private mounted = false;

  constructor(private props: Record<string, any> = {}) {
    this.styleManager = new StyleManager();
    this.state = reactive(this.initState() ?? {});
    this.initStyles();
    this.templateEngine = new TemplateEngine(this.state);
  }

  protected abstract initState(): object;
  protected abstract initStyles(): void;
  protected abstract render(): VNode;

  public mount(container: HTMLElement): void {
    this.vnode = this.render();
    this.el = this.createDOM(this.vnode);
    container.appendChild(this.el);
    this.mounted = true;
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

  private createDOM(vnode: VNode): HTMLElement {
    if (typeof vnode.type === 'string') {
      const el = document.createElement(vnode.type);
      
      Object.entries(vnode.props).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });

      if (vnode.listeners) {
        Object.entries(vnode.listeners).forEach(([event, handler]) => {
          el.addEventListener(event, handler);
        });
      }

      vnode.children.forEach(child => {
        if (typeof child === 'string') {
          const textNode = this.templateEngine.parseTemplate(child);
          el.appendChild(textNode);
        } else {
          el.appendChild(this.createDOM(child));
        }
      });

      return el;
    }
    
    throw new Error('Function components not implemented yet');
  }

  protected get router() {
    return (globalThis as any).__APP__?.router;
  }
} 