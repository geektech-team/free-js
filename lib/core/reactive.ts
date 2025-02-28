// 定义响应式对象接口
interface ReactiveEffect {
  (): void;
  deps: Set<ReactiveEffect>[];
}

// 定义响应式标记
const IS_REACTIVE = Symbol('is_reactive');

// 响应式系统
export class ReactiveSystem {
  private static instance: ReactiveSystem;
  private activeEffect: ReactiveEffect | null = null;
  private targetMap = new WeakMap<object, Map<string, Set<ReactiveEffect>>>();
  private reactiveMap = new WeakMap<object, object>();

  private constructor() {}

  public static getInstance(): ReactiveSystem {
    if (!ReactiveSystem.instance) {
      ReactiveSystem.instance = new ReactiveSystem();
    }
    return ReactiveSystem.instance;
  }

  public reactive<T extends object>(target: T): T {
    // 如果传入的是已经是响应式对象，直接返回
    if ((target as any)[IS_REACTIVE]) {
      return target;
    }

    // 如果目标已经有对应的响应式对象，返回已存在的代理
    if (this.reactiveMap.has(target)) {
      return this.reactiveMap.get(target) as T;
    }

    const proxy = new Proxy(target, {
      get: (target, key: string | symbol) => {
        // 处理响应式标记的特殊属性
        if (key === IS_REACTIVE) {
          return true;
        }
        // 收集依赖
        if (typeof key === 'string') {
          this.track(target, key);
        }
        const value = Reflect.get(target, key);
        // 如果是对象，递归转换为响应式
        if (value && typeof value === 'object') {
          return this.reactive(value);
        }
        return value;
      },
      set: (target, key: string, value) => {
        const oldValue = Reflect.get(target, key);
        const result = Reflect.set(target, key, value);
        // 只有当值真正改变时才触发更新
        if (oldValue !== value) {
          this.trigger(target, key);
        }
        return result;
      }
    });

    // 存储响应式对象的映射关系
    this.reactiveMap.set(target, proxy);
    return proxy;
  }

  public effect(fn: () => void): void {
    const effectFn: ReactiveEffect = () => {
      // 清除之前的依赖关系
      this.cleanup(effectFn);
      this.activeEffect = effectFn;
      fn();
      this.activeEffect = null;
    };
    effectFn.deps = [];
    effectFn();
  }

  private cleanup(effect: ReactiveEffect): void {
    // 清除effect的所有依赖
    effect.deps.forEach(dep => {
      dep.delete(effect);
    });
    effect.deps.length = 0;
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
    
    if (!dep.has(this.activeEffect)) {
      dep.add(this.activeEffect);
      this.activeEffect.deps.push(dep);
    }
  }

  private trigger(target: object, key: string): void {
    const depsMap = this.targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    // 创建依赖的副本进行遍历，避免在遍历过程中依赖发生变化
    const effects = new Set(dep);
    effects.forEach(effect => effect());
  }
}

// 导出响应式API
export function reactive<T extends object>(target: T): T {
  return ReactiveSystem.getInstance().reactive(target);
}

export function effect(fn: () => void): void {
  ReactiveSystem.getInstance().effect(fn);
}
