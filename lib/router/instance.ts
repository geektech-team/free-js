import { Router } from './index';

// 创建一个全局路由实例
let router: Router | null = null;

export function setRouter(r: Router) {
  router = r;
}

export function useRouter(): Router {
  if (!router) {
    throw new Error('Router is not initialized');
  }
  return router;
}