import { FreeApp } from '../core/app';
import { Component } from '../core/component';
import { setRouter } from './instance';

export interface RouteRecord {
  path: string;
  component: new () => Component;
}

export class Router {
  private currentRoute: RouteRecord | null = null;
  private routes: RouteRecord[] = [];
  private app: FreeApp | null = null;

  constructor(options: { routes: RouteRecord[] }) {
    this.routes = options.routes;
    
    // 监听 URL 变化
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  private handleRoute(): void {
    const path = window.location.pathname;
    const route = this.routes.find(route => route.path === path) 
      || this.routes.find(route => route.path === '/');  // 找不到路由时使用根路由
    
    if (route && this.app) {
      this.currentRoute = route;
      // 更新应用的根组件
      this.app.updateRootComponent(route.component);
    }
  }

  public push(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  public install(app: FreeApp): void {
    this.app = app;
    setRouter(this);  // 设置全局路由实例
    
    // 初始化路由状态
    if (this.routes.length > 0) {
      const currentPath = window.location.pathname;
      const hasMatchingRoute = this.routes.some(route => route.path === currentPath);
      
      if (!hasMatchingRoute) {
        this.push('/');
      } else {
        this.handleRoute();
      }
    }
  }
}

export function createRouter(options: { routes: RouteRecord[] }): Router {
  return new Router(options);
}