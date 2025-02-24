import { createApp } from '../lib';
import { createRouter } from '../lib/router';
import { Counter } from './components/Counter';
import { Home } from './components/Home';

// 创建路由实例
const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/counter', component: Counter }
  ]
});

// 创建应用实例，使用默认容器
const app = createApp();

// 使用路由插件
app.use(router);
app.mount();