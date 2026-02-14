import { FreeApp } from '../core/app';
import { setRouter } from './instance';

export interface RouteRecord {
  /** 路由路径 */
  path: string;
  /** 组件构造函数 */
  component: any;
  /** 路由名称 */
  name?: string;
  /** 路由参数 */
  meta?: Record<string, any>;
}

export interface RouterOptions {
  routes: RouteRecord[];
  mode?: 'history' | 'hash';
  base?: string;
}

export interface RouteLocation {
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  fullPath: string;
  name?: string;
  meta?: Record<string, any>;
}

export class Router {
  protected currentRoute: RouteRecord | null = null;
  protected currentLocation: RouteLocation | null = null;
  private routes: RouteRecord[] = [];
  private app: FreeApp | null = null;
  private mode: 'history' | 'hash';
  private base: string;
  private routeChangeListeners: ((to: RouteLocation, from: RouteLocation | null) => void)[] = [];

  constructor(options: RouterOptions) {
    this.routes = options.routes || [];
    this.mode = options.mode || 'history';
    this.base = options.base || '/';
    
    // 验证路由配置
    this.validateRoutes();
    
    // 初始化路由事件监听
    this.initEvents();
  }

  /**
   * 验证路由配置
   */
  private validateRoutes(): void {
    if (!Array.isArray(this.routes)) {
      throw new Error('Router routes must be an array');
    }
    
    // 检查是否有重复的路由路径
    const paths = new Set<string>();
    this.routes.forEach(route => {
      if (paths.has(route.path)) {
        throw new Error(`Duplicate route path: ${route.path}`);
      }
      paths.add(route.path);
    });
  }

  /**
   * 初始化事件监听
   */
  private initEvents(): void {
    if (this.mode === 'history') {
      window.addEventListener('popstate', () => {
        this.handleRouteChange();
      });
    } else {
      window.addEventListener('hashchange', () => {
        this.handleRouteChange();
      });
    }
  }

  /**
   * 处理路由变化
   */
  private handleRouteChange(): void {
    const location = this.getCurrentLocation();
    const fromLocation = this.currentLocation;
    
    // 查找匹配的路由
    const route = this.matchRoute(location.path);
    
    if (route && this.app) {
      // 更新当前路由状态
      this.currentRoute = route;
      this.currentLocation = {
        ...location,
        name: route.name,
        meta: route.meta
      };
      
      // 触发路由变化监听器
      this.triggerRouteChangeListeners(this.currentLocation!, fromLocation);
      
      // 更新应用的根组件
      this.app.updateRootComponent(route.component);
    }
  }

  /**
   * 获取当前位置信息
   */
  private getCurrentLocation(): RouteLocation {
    let path: string;
    let fullPath: string;
    
    if (this.mode === 'history') {
      fullPath = window.location.pathname + window.location.search;
      path = window.location.pathname;
    } else {
      // 处理 hash 模式
      const hash = window.location.hash;
      fullPath = hash || '/';
      path = fullPath.startsWith('#') ? fullPath.slice(1) : fullPath;
    }
    
    // 移除基础路径
    if (path.startsWith(this.base) && path !== '/') {
      path = path.slice(this.base.length);
    }
    
    // 确保路径以 / 开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    return {
      path,
      fullPath,
      query: this.parseQuery(window.location.search),
      params: {}
    };
  }

  /**
   * 解析查询参数
   */
  private parseQuery(queryString: string): Record<string, string> {
    const query: Record<string, string> = {};
    if (!queryString || queryString === '?') return query;
    
    const params = queryString.slice(1).split('&');
    params.forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });
    
    return query;
  }

  /**
   * 匹配路由
   */
  private matchRoute(path: string): RouteRecord | null {
    // 精确匹配
    let route = this.routes.find(r => r.path === path);
    
    // 找不到时尝试匹配根路由
    if (!route) {
      route = this.routes.find(r => r.path === '/');
    }
    
    return route || null;
  }

  /**
   * 触发路由变化监听器
   */
  private triggerRouteChangeListeners(to: RouteLocation, from: RouteLocation | null): void {
    this.routeChangeListeners.forEach(listener => {
      try {
        listener(to, from);
      } catch (error) {
        console.error('Route change listener error:', error);
      }
    });
  }

  /**
   * 导航到指定路径
   */
  public push(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new Error('Path must be a non-empty string');
    }
    
    // 确保路径以 / 开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // 添加基础路径
    const fullPath = this.base === '/' ? path : this.base + path;
    
    if (this.mode === 'history') {
      window.history.pushState({}, '', fullPath);
    } else {
      window.location.hash = fullPath;
    }
    
    this.handleRouteChange();
  }

  /**
   * 替换当前路径
   */
  public replace(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new Error('Path must be a non-empty string');
    }
    
    // 确保路径以 / 开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // 添加基础路径
    const fullPath = this.base === '/' ? path : this.base + path;
    
    if (this.mode === 'history') {
      window.history.replaceState({}, '', fullPath);
    } else {
      // 替换 hash 而不添加历史记录
      const href = window.location.href.split('#')[0];
      window.location.replace(`${href}#${fullPath}`);
    }
    
    this.handleRouteChange();
  }

  /**
   * 前进
   */
  public forward(): void {
    window.history.forward();
  }

  /**
   * 后退
   */
  public back(): void {
    window.history.back();
  }

  /**
   * 跳转到指定历史记录
   */
  public go(delta: number): void {
    window.history.go(delta);
  }

  /**
   * 安装路由到应用
   */
  public install(app: FreeApp): void {
    this.app = app;
    setRouter(this);  // 设置全局路由实例
    
    // 将路由实例挂载到应用上下文
    const context = app.getContext();
    (context as any).router = this;
    
    // 初始化路由状态
    this.handleRouteChange();
  }

  /**
   * 获取当前路由信息
   */
  public getCurrentRoute(): RouteLocation | null {
    return this.currentLocation;
  }

  /**
   * 监听路由变化
   */
  public onRouteChange(listener: (to: RouteLocation, from: RouteLocation | null) => void): () => void {
    this.routeChangeListeners.push(listener);
    
    // 返回取消监听函数
    return () => {
      const index = this.routeChangeListeners.indexOf(listener);
      if (index > -1) {
        this.routeChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * 获取所有路由配置
   */
  public getRoutes(): RouteRecord[] {
    return [...this.routes];
  }

  /**
   * 动态添加路由
   */
  public addRoute(route: RouteRecord): void {
    // 检查是否已存在相同路径的路由
    const existingRoute = this.routes.find(r => r.path === route.path);
    if (existingRoute) {
      throw new Error(`Route already exists: ${route.path}`);
    }
    
    this.routes.push(route);
    
    // 检查是否需要更新当前路由
    const currentLocation = this.getCurrentLocation();
    if (currentLocation.path === route.path) {
      this.handleRouteChange();
    }
  }
}

export function createRouter(options: RouterOptions): Router {
  return new Router(options);
}