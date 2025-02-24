import { AppOptions, FreeApp } from './core/app';

export * from './core/reactive';
export * from './core/vnode';
export * from './core/component';
export * from './style/StyleManager';
export * from './router/instance';


export function createApp(options: AppOptions = {}): FreeApp {
  return new FreeApp(options);
}