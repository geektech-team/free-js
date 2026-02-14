// 定义响应式对象接口
export interface ReactiveEffect {
  (): void;
  deps: Set<ReactiveEffect>[];
  id: number;
  active: boolean;
  scheduler?: (effect: ReactiveEffect) => void;
}

// 定义响应式标记
const IS_REACTIVE = Symbol('is_reactive');
const IS_READONLY = Symbol('is_readonly');
let effectId = 0;

// 响应式系统
export class ReactiveSystem {
  private static instance: ReactiveSystem;
  private activeEffect: ReactiveEffect | null = null;
  private targetMap = new WeakMap<
    object,
    Map<string | symbol, Set<ReactiveEffect>>
  >();
  private reactiveMap = new WeakMap<object, object>();
  private readonlyMap = new WeakMap<object, object>();

  // 数组的变异方法
  private arrayMethods = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse',
  ];

  private constructor() {}

  public static getInstance(): ReactiveSystem {
    if (!ReactiveSystem.instance) {
      ReactiveSystem.instance = new ReactiveSystem();
    }
    return ReactiveSystem.instance;
  }

  public reactive<T extends object>(target: T): T {
    // 检查输入参数
    if (target === null || typeof target !== 'object') {
      console.warn('reactive: target must be an object');
      return target;
    }

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
        if (key === IS_READONLY) {
          return false;
        }

        // 收集依赖
        this.track(target, key);

        const value = Reflect.get(target, key);

        // 处理数组的变异方法
        if (
          Array.isArray(target) &&
          typeof key === 'string' &&
          this.arrayMethods.includes(key)
        ) {
          return (...args: any[]) => {
            // 执行原始方法
            const result = (value as Function).apply(target, args);
            // 触发数组更新
            this.trigger(target, 'length');
            this.trigger(target, key);
            return result;
          };
        }

        // 如果是对象，递归转换为响应式
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return this.reactive(value);
        }
        return value;
      },
      set: (target, key: string | symbol, value) => {
        // 检查是否是只读的
        if ((target as any)[IS_READONLY]) {
          console.warn(`Cannot set property ${String(key)} on readonly object`);
          return false;
        }

        const oldValue = Reflect.get(target, key);

        // 如果新值是对象，转换为响应式
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value as any)[IS_REACTIVE]
        ) {
          value = this.reactive(value);
        }

        const result = Reflect.set(target, key, value);

        // 只有当值真正改变时才触发更新
        if (oldValue !== value) {
          this.trigger(target, key);
          // 对于数组索引的修改，同时触发length的更新
          if (
            Array.isArray(target) &&
            typeof key === 'string' &&
            !isNaN(Number(key))
          ) {
            this.trigger(target, 'length');
          }
        }
        return result;
      },
      deleteProperty: (target, key: string | symbol) => {
        // 检查是否是只读的
        if ((target as any)[IS_READONLY]) {
          console.warn(
            `Cannot delete property ${String(key)} on readonly object`
          );
          return false;
        }

        const hadKey = key in target;
        const result = Reflect.deleteProperty(target, key);

        if (hadKey) {
          this.trigger(target, key);
          // 对于数组，同时触发length的更新
          if (Array.isArray(target)) {
            this.trigger(target, 'length');
          }
        }
        return result;
      },
    });

    // 存储响应式对象的映射关系
    this.reactiveMap.set(target, proxy);
    return proxy;
  }

  public readonly<T extends object>(target: T): Readonly<T> {
    // 检查输入参数
    if (target === null || typeof target !== 'object') {
      console.warn('readonly: target must be an object');
      return target;
    }

    // 如果传入的是已经是只读响应式对象，直接返回
    if ((target as any)[IS_READONLY]) {
      return target as Readonly<T>;
    }

    // 如果目标已经有对应的只读响应式对象，返回已存在的代理
    if (this.readonlyMap.has(target)) {
      return this.readonlyMap.get(target) as Readonly<T>;
    }

    const proxy = new Proxy(target, {
      get: (target, key: string | symbol) => {
        // 处理响应式标记的特殊属性
        if (key === IS_REACTIVE || key === IS_READONLY) {
          return true;
        }

        const value = Reflect.get(target, key);
        // 如果是对象，递归转换为只读响应式
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return this.readonly(value);
        }
        return value;
      },
      set: () => {
        console.warn('Cannot set property on readonly object');
        return false;
      },
      deleteProperty: () => {
        console.warn('Cannot delete property on readonly object');
        return false;
      },
    });

    // 存储只读响应式对象的映射关系
    this.readonlyMap.set(target, proxy);
    return proxy as Readonly<T>;
  }

  public effect<T = any>(
    fn: () => T,
    options?: {
      lazy?: boolean;
      scheduler?: (effect: ReactiveEffect) => void;
    }
  ): ReactiveEffect {
    const { lazy = false, scheduler } = options || {};

    const effectFn: ReactiveEffect = () => {
      try {
        // 清除之前的依赖关系
        this.cleanup(effectFn);
        this.activeEffect = effectFn;
        return fn();
      } catch (error) {
        console.error('Effect error:', error);
        return undefined;
      } finally {
        this.activeEffect = null;
      }
    };

    effectFn.id = effectId++;
    effectFn.deps = [];
    effectFn.active = true;
    effectFn.scheduler = scheduler;

    // 如果不是懒加载，立即执行
    if (!lazy) {
      effectFn();
    }

    return effectFn;
  }

  public computed<T>(getter: () => T): {
    value: T;
  } {
    let dirty = true;
    let value: T;

    const effect = this.effect(
      () => {
        value = getter();
        dirty = false;
      },
      { lazy: true }
    );

    return {
      get value(): T {
        if (dirty) {
          effect();
        }
        return value as T;
      },
    };
  }

  private cleanup(effect: ReactiveEffect): void {
    // 清除effect的所有依赖
    effect.deps.forEach((dep) => {
      dep.delete(effect);
    });
    effect.deps.length = 0;
  }

  private track(target: object, key: string | symbol): void {
    if (!this.activeEffect || !this.activeEffect.active) return;

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

  private trigger(target: object, key: string | symbol): void {
    const depsMap = this.targetMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    // 创建依赖的副本进行遍历，避免在遍历过程中依赖发生变化
    const effects = new Set(dep);
    effects.forEach((effect) => {
      if (effect.active) {
        if (effect.scheduler) {
          effect.scheduler(effect);
        } else {
          effect();
        }
      }
    });
  }

  // 停止一个effect的执行
  public stop(effect: ReactiveEffect): void {
    if (effect.active) {
      this.cleanup(effect);
      effect.active = false;
    }
  }
}

// 导出响应式API
export function reactive<T extends object>(target: T): T {
  return ReactiveSystem.getInstance().reactive(target);
}

export function readonly<T extends object>(target: T): Readonly<T> {
  return ReactiveSystem.getInstance().readonly(target);
}

export function effect<T = any>(
  fn: () => T,
  options?: {
    lazy?: boolean;
    scheduler?: (effect: ReactiveEffect) => void;
  }
): ReactiveEffect {
  return ReactiveSystem.getInstance().effect(fn, options);
}

export function computed<T>(getter: () => T): {
  value: T;
} {
  return ReactiveSystem.getInstance().computed(getter);
}

export function stop(effect: ReactiveEffect): void {
  ReactiveSystem.getInstance().stop(effect);
}

// 工具函数：判断是否是响应式对象
export function isReactive(value: any): boolean {
  return !!(value && typeof value === 'object' && (value as any)[IS_REACTIVE]);
}

// 工具函数：判断是否是只读响应式对象
export function isReadonly(value: any): boolean {
  return !!(value && typeof value === 'object' && (value as any)[IS_READONLY]);
}
