// 定义响应式对象接口
interface ReactiveEffect {
  (): void;
  deps: Set<ReactiveEffect>[];
}

// 响应式系统
export class ReactiveSystem {
  private static instance: ReactiveSystem;
  private activeEffect: ReactiveEffect | null = null;
  private targetMap = new WeakMap<object, Map<string, Set<ReactiveEffect>>>();

  private constructor() {}

  public static getInstance(): ReactiveSystem {
    if (!ReactiveSystem.instance) {
      ReactiveSystem.instance = new ReactiveSystem();
    }
    return ReactiveSystem.instance;
  }

  public reactive<T extends object>(target: T): T {
    if ((target as any).__isReactive) {
      return target;
    }

    return new Proxy(target, {
      get: (target, key: string) => {
        this.track(target, key);
        const value = Reflect.get(target, key);
        if (value && typeof value === 'object') {
          return this.reactive(value);
        }
        return value;
      },
      set: (target, key: string, value) => {
        const result = Reflect.set(target, key, value);
        this.trigger(target, key);
        return result;
      }
    });
  }

  public effect(fn: () => void): void {
    const effectFn: ReactiveEffect = () => {
      this.activeEffect = effectFn;
      fn();
      this.activeEffect = null;
    };
    effectFn.deps = [];
    effectFn();
  }

  private track(target: object, key: string): void {
    if (!this.activeEffect) return;
    
    let depsMap = this.targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      this.targetMap.set(target, depsMap);
    }
    
    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set();
      depsMap.set(key, dep);
    }
    
    dep.add(this.activeEffect);
    this.activeEffect.deps.push(dep);
  }

  private trigger(target: object, key: string): void {
    const depsMap = this.targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    dep.forEach(effect => effect());
  }
}

// 导出响应式API
export function reactive<T extends object>(target: T): T {
  return ReactiveSystem.getInstance().reactive(target);
}

export function effect(fn: () => void): void {
  ReactiveSystem.getInstance().effect(fn);
}
