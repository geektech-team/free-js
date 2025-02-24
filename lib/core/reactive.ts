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
    return new Proxy(target, {
      get: (target, key: string) => {
        this.track(target, key);
        return Reflect.get(target, key);
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

// 更新DOM的函数，这里只是示例，具体实现需要根据实际情况
function updateDOM(key: string, value: string) {
  if (key === 'textContent') {
    document.body.textContent = value;
  }
}