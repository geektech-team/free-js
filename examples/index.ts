import { createApp } from '../lib';
import { createRouter } from '../lib/router';
import { Home } from './components/Home';
import { Counter } from './components/Counter';

// 创建全局状态
const globalState = {
  appName: 'Free.js Framework Demo',
  version: '1.0.0',
  user: {
    name: 'Demo User',
    isLoggedIn: true
  }
};

// 创建路由实例
const router = createRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: '首页' }
    },
    {
      path: '/counter',
      name: 'counter',
      component: Counter,
      meta: { title: '计数器' }
    }
  ],
  mode: 'history',
  base: '/'
});

// 路由变化时更新页面标题
router.onRouteChange((to) => {
  document.title = to.meta?.title || 'Free.js Framework';
});

// 创建应用实例
const app = createApp({
  // 指定挂载点
  rootElement: '#app',
  // 全局状态
  state: globalState,
  // 全局配置
  config: {
    debug: true,
    enableDevTools: true
  }
});

// 使用路由插件
app.use(router);

// 挂载应用
// 挂载应用
app.mount();
console.log('应用已成功挂载!');

// 监听应用卸载
app.onUnmounted(() => {
  console.log('应用已卸载');
});

// 为了演示，导出应用实例
(window as any).app = app;