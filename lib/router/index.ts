import { Component, ComponentConstructor } from '../core/component';
import { FreeApp } from '../core/app';
import type { VNode } from '../core/vnode';
import { setRouter } from './instance';

export interface RouteRecord {
  path: string;
  component: ComponentConstructor;
  name?: string;
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

export type RouteChangeListener = (
  to: RouteLocation,
  from: RouteLocation | null
) => void;

interface RouteMatch {
  route: RouteRecord;
  params: Record<string, string>;
}

export class Router {
  protected currentRoute: RouteRecord | null = null;
  protected currentLocation: RouteLocation | null = null;
  private readonly routes: RouteRecord[] = [];
  private app: FreeApp | null = null;
  private readonly mode: 'history' | 'hash';
  private readonly base: string;
  private readonly routeChangeListeners: RouteChangeListener[] = [];
  private removeWindowListener?: () => void;

  constructor(options: RouterOptions | RouteRecord[]) {
    const resolvedOptions = Array.isArray(options)
      ? { routes: options }
      : options;

    this.routes = resolvedOptions.routes || [];
    this.mode = resolvedOptions.mode || 'history';
    this.base = resolvedOptions.base || '/';
    this.validateRoutes();
    this.initEvents();
    this.resolveCurrentRoute();
  }

  public install(app: FreeApp): void {
    this.app = app;
    app.router = this;
    setRouter(this);

    const context = app.getContext();
    (context as any).router = this;

    this.resolveCurrentRoute();
  }

  public push(path: string): void {
    this.navigate(path, false);
  }

  public replace(path: string): void {
    this.navigate(path, true);
  }

  public forward(): void {
    window.history.forward();
  }

  public back(): void {
    window.history.back();
  }

  public go(delta: number): void {
    window.history.go(delta);
  }

  public getCurrentRoute(): RouteLocation | null {
    if (!this.currentLocation) {
      this.resolveCurrentRoute();
    }
    return this.currentLocation;
  }

  public getCurrentRouteRecord(): RouteRecord | null {
    if (!this.currentRoute) {
      this.resolveCurrentRoute();
    }
    return this.currentRoute;
  }

  public onRouteChange(listener: RouteChangeListener): () => void {
    this.routeChangeListeners.push(listener);

    return () => {
      const index = this.routeChangeListeners.indexOf(listener);
      if (index > -1) {
        this.routeChangeListeners.splice(index, 1);
      }
    };
  }

  public getRoutes(): RouteRecord[] {
    return [...this.routes];
  }

  public addRoute(route: RouteRecord): void {
    if (this.routes.some((item) => item.path === route.path)) {
      throw new Error(`Route already exists: ${route.path}`);
    }

    this.routes.push(route);

    const location = this.getCurrentLocation();
    if (location.path === route.path) {
      this.handleRouteChange();
    }
  }

  public createHref(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const fullPath =
      this.base === '/' ? normalizedPath : this.base + normalizedPath;
    return this.mode === 'hash' ? `#${fullPath}` : fullPath;
  }

  public destroy(): void {
    this.removeWindowListener?.();
    this.removeWindowListener = undefined;
    if (this.app?.router === this) {
      this.app.router = undefined;
    }
    this.app = null;
  }

  private navigate(path: string, replace: boolean): void {
    if (!path || typeof path !== 'string') {
      throw new Error('Path must be a non-empty string');
    }

    const normalizedPath = this.normalizePath(path);
    const fullPath =
      this.base === '/' ? normalizedPath : this.base + normalizedPath;

    if (this.mode === 'history') {
      if (replace) {
        window.history.replaceState({}, '', fullPath);
      } else {
        window.history.pushState({}, '', fullPath);
      }
    } else if (replace) {
      const href = window.location.href.split('#')[0];
      window.location.replace(`${href}#${fullPath}`);
    } else {
      window.location.hash = fullPath;
    }

    this.handleRouteChange();
  }

  private validateRoutes(): void {
    if (!Array.isArray(this.routes)) {
      throw new Error('Router routes must be an array');
    }

    const paths = new Set<string>();
    this.routes.forEach((route) => {
      if (paths.has(route.path)) {
        throw new Error(`Duplicate route path: ${route.path}`);
      }
      paths.add(route.path);
    });
  }

  private initEvents(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const eventName = this.mode === 'history' ? 'popstate' : 'hashchange';
    const listener = (): void => {
      this.handleRouteChange();
    };

    window.addEventListener(eventName, listener);
    this.removeWindowListener = () => {
      window.removeEventListener(eventName, listener);
    };
  }

  private handleRouteChange(): void {
    const fromLocation = this.currentLocation;
    const nextLocation = this.resolveCurrentRoute();

    if (!this.isSameLocation(fromLocation, nextLocation)) {
      this.triggerRouteChangeListeners(nextLocation, fromLocation);
    }
  }

  private resolveCurrentRoute(): RouteLocation {
    const location = this.getCurrentLocation();
    const match = this.matchRoute(location.path);
    const route = match?.route ?? null;

    this.currentRoute = route;
    this.currentLocation = {
      ...location,
      params: match?.params ?? {},
      name: route?.name,
      meta: route?.meta,
    };

    return this.currentLocation;
  }

  private getCurrentLocation(): RouteLocation {
    let path: string;
    let fullPath: string;

    if (this.mode === 'history') {
      fullPath = window.location.pathname + window.location.search;
      path = window.location.pathname;
    } else {
      const hash = window.location.hash;
      fullPath = hash || '#/';
      path = fullPath.startsWith('#') ? fullPath.slice(1) : fullPath;
    }

    if (path.startsWith(this.base) && this.base !== '/' && path !== '/') {
      path = path.slice(this.base.length);
    }

    path = this.normalizePath(path);

    return {
      path,
      fullPath,
      query: this.parseQuery(
        this.mode === 'hash'
          ? (path.split('?')[1] ?? '')
          : window.location.search
      ),
      params: {},
    };
  }

  private parseQuery(queryString: string): Record<string, string> {
    const query: Record<string, string> = {};
    const normalizedQuery = queryString.startsWith('?')
      ? queryString.slice(1)
      : queryString;

    if (!normalizedQuery) {
      return query;
    }

    normalizedQuery.split('&').forEach((param) => {
      const [key, value] = param.split('=');
      if (key) {
        query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });

    return query;
  }

  private matchRoute(path: string): RouteMatch | null {
    const normalizedPath = this.normalizePath(path.split('?')[0]);

    for (const route of this.routes) {
      const params = this.matchRoutePath(route.path, normalizedPath);
      if (params) {
        return { route, params };
      }
    }

    const fallback = this.routes.find((route) => route.path === '/');
    return fallback ? { route: fallback, params: {} } : null;
  }

  private matchRoutePath(
    routePath: string,
    currentPath: string
  ): Record<string, string> | null {
    const routeSegments = this.getPathSegments(routePath);
    const currentSegments = this.getPathSegments(currentPath);

    if (routeSegments.length !== currentSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let index = 0; index < routeSegments.length; index += 1) {
      const routeSegment = routeSegments[index];
      const currentSegment = currentSegments[index];

      if (routeSegment.startsWith(':')) {
        const paramName = routeSegment.slice(1);
        if (!paramName) {
          return null;
        }
        params[decodeURIComponent(paramName)] =
          decodeURIComponent(currentSegment);
        continue;
      }

      if (routeSegment !== currentSegment) {
        return null;
      }
    }

    return params;
  }

  private getPathSegments(path: string): string[] {
    const normalizedPath = this.normalizePath(path);
    if (normalizedPath === '/') {
      return [];
    }

    return normalizedPath.split('/').filter(Boolean);
  }

  private normalizePath(path: string): string {
    if (!path.startsWith('/')) {
      return `/${path}`;
    }
    return path || '/';
  }

  private isSameLocation(
    from: RouteLocation | null,
    to: RouteLocation | null
  ): boolean {
    return from?.fullPath === to?.fullPath && from?.name === to?.name;
  }

  private triggerRouteChangeListeners(
    to: RouteLocation,
    from: RouteLocation | null
  ): void {
    this.routeChangeListeners.forEach((listener) => {
      try {
        listener(to, from);
      } catch (error) {
        console.error('Route change listener error:', error);
      }
    });
  }
}

export interface RouterLinkProps {
  to: string;
  replace?: boolean;
  className?: string;
  activeClass?: string;
  children?: Array<VNode | string>;
}

export class RouterLink extends Component<RouterLinkProps> {
  private unsubscribe?: () => void;

  protected initState(): object {
    const router = this.router as Router | undefined;
    return {
      currentPath: router?.getCurrentRoute()?.path ?? window.location.pathname,
    };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const router = this.router as Router | undefined;
    this.unsubscribe = router?.onRouteChange((to) => {
      this.state.currentPath = to.path;
    });
  }

  protected onUnmounted(): void {
    this.unsubscribe?.();
  }

  protected render(): VNode {
    const router = this.router as Router | undefined;
    const activeClass = this.props.activeClass ?? 'active';
    const isActive = this.state.currentPath === this.props.to;
    const className = [this.props.className, isActive ? activeClass : undefined]
      .filter(Boolean)
      .join(' ');

    return {
      tag: 'a',
      props: {
        href: router?.createHref(this.props.to) ?? this.props.to,
        className,
      },
      listeners: {
        click: (event: Event) => {
          event.preventDefault();
          if (this.props.replace) {
            router?.replace(this.props.to);
          } else {
            router?.push(this.props.to);
          }
        },
      },
      children:
        this.props.children && this.props.children.length > 0
          ? this.props.children
          : [this.props.to],
    };
  }
}

export class RouterView extends Component {
  private unsubscribe?: () => void;

  protected initState(): object {
    const router = this.router as Router | undefined;
    return {
      route: router?.getCurrentRoute(),
      record: router?.getCurrentRouteRecord(),
    };
  }

  protected initStyles(): void {}

  protected onMounted(): void {
    const router = this.router as Router | undefined;
    this.unsubscribe = router?.onRouteChange((to) => {
      this.state.route = to;
      this.state.record = router.getCurrentRouteRecord();
    });
  }

  protected onUnmounted(): void {
    this.unsubscribe?.();
  }

  protected render(): VNode {
    const routeRecord =
      this.state.record ??
      (this.router as Router | undefined)?.getCurrentRouteRecord();

    return {
      tag: 'div',
      props: { 'data-router-view': '' },
      children: routeRecord ? [{ component: routeRecord.component }] : [],
    };
  }
}

export function createRouter(options: RouterOptions | RouteRecord[]): Router {
  return new Router(options);
}
