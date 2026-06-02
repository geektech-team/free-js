# 路由 API

本文档介绍 Free-JS 路由系统的 API。

## createRouter

`createRouter` 函数用于创建路由实例：

```typescript
import { createRouter } from 'free-js/router';

const router = createRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeComponent,
      meta: { title: '首页' }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutComponent,
      meta: { title: '关于我们' }
    }
  ],
  mode: 'history',
  base: '/'
});
```

### 参数

- `options`: 路由配置选项
  - `routes`: 路由规则数组
  - `mode`: 路由模式，可选值为 `'history'` 或 `'hash'`，默认为 `'history'`
  - `base`: 基础路径，默认为 `'/'`

### 返回值

返回路由实例对象。

## 路由规则

### 基本路由规则

```typescript
{
  path: '/',
  name: 'home',
  component: HomeComponent,
  meta: { title: '首页' }
}
```

### 带参数的路由规则

```typescript
{
  path: '/user/:id',
  name: 'user',
  component: UserComponent,
  meta: { title: '用户详情' }
}
```

### 重定向路由规则

```typescript
{
  path: '/old-path',
  redirect: '/new-path'
}

// 或使用命名路由
{
  path: '/old-path',
  redirect: { name: 'home' }
}
```

### 嵌套路由规则

```typescript
{
  path: '/dashboard',
  component: DashboardComponent,
  children: [
    {
      path: '',
      redirect: 'overview'
    },
    {
      path: 'overview',
      component: OverviewComponent
    },
    {
      path: 'settings',
      component: SettingsComponent
    }
  ]
}
```

## 路由实例方法

### push

导航到指定位置：

```typescript
// 字符串路径
router.push('/about');

// 命名路由
router.push({ name: 'user', params: { id: 123 } });

// 带查询参数
router.push({ path: '/search', query: { q: 'free-js' } });
```

### replace

替换当前历史记录：

```typescript
router.replace('/about');
```

### back

导航回退：

```typescript
router.back();
```

### forward

导航前进：

```typescript
router.forward();
```

### go

导航到指定历史记录位置：

```typescript
router.go(-1); // 回退一步
router.go(1);  // 前进一步
router.go(0);  // 刷新页面
```

### beforeEach

添加全局前置守卫：

```typescript
router.beforeEach((to, from, next) => {
  // 检查是否需要登录
  if (to.meta?.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

### afterEach

添加全局后置守卫：

```typescript
router.afterEach((to, from) => {
  // 更新页面标题
  document.title = to.meta?.title || 'Free-JS App';
});
```

### onRouteChange

监听路由变化：

```typescript
router.onRouteChange((to, from) => {
  console.log(`Route changed from ${from.path} to ${to.path}`);
});
```

## 路由实例属性

### currentRoute

当前路由信息：

```typescript
console.log(router.currentRoute);
// {
//   path: '/user/123',
//   params: { id: '123' },
//   query: {},
//   name: 'user',
//   meta: { title: '用户详情' }
// }
```

### routes

路由配置：

```typescript
console.log(router.routes);
```

### mode

路由模式：

```typescript
console.log(router.mode); // 'history' 或 'hash'
```

### base

基础路径：

```typescript
console.log(router.base); // '/'
```

## 路由对象

### 路由对象属性

- `path`: 当前路径
- `params`: 路径参数
- `query`: 查询参数
- `name`: 路由名称
- `meta`: 路由元数据

### 示例

```typescript
// 路径: /user/123?tab=profile
const route = router.currentRoute;
console.log(route.path); // '/user/123'
console.log(route.params); // { id: '123' }
console.log(route.query); // { tab: 'profile' }
console.log(route.name); // 'user'
console.log(route.meta); // { title: '用户详情' }
```

## 组件内路由

### 访问路由实例

在组件中，您可以通过 `this.router` 获取路由实例：

```typescript
class UserComponent extends Component {
  protected navigateToHome() {
    this.router.push('/');
  }
}
```

### 组件内守卫

```typescript
class UserComponent extends Component {
  // 路由进入前
  beforeRouteEnter(to, from, next) {
    // 此时组件实例还未创建
    console.log('Before route enter');
    next();
  }

  // 路由更新前（参数变化）
  beforeRouteUpdate(to, from, next) {
    console.log('Before route update');
    next();
  }

  // 路由离开前
  beforeRouteLeave(to, from, next) {
    console.log('Before route leave');
    next();
  }
}
```

## 示例

### 完整路由示例

```typescript
import { createApp } from 'free-js';
import { createRouter } from 'free-js/router';
import { HomeComponent } from './components/HomeComponent';
import { AboutComponent } from './components/AboutComponent';
import { UserComponent } from './components/UserComponent';
import { NotFoundComponent } from './components/NotFoundComponent';

// 创建路由实例
const router = createRouter({
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeComponent,
      meta: { title: '首页' }
    },
    {
      path: '/about',
      name: 'about',
      component: AboutComponent,
      meta: { title: '关于我们' }
    },
    {
      path: '/user/:id',
      name: 'user',
      component: UserComponent,
      meta: { title: '用户详情' }
    },
    {
      path: '*',
      component: NotFoundComponent,
      meta: { title: '404 页面未找到' }
    }
  ],
  mode: 'history'
});

// 添加全局守卫
router.beforeEach((to, from, next) => {
  console.log(`Navigating from ${from.path} to ${to.path}`);
  next();
});

router.afterEach((to, from) => {
  document.title = to.meta?.title || 'Free-JS App';
});

// 创建应用实例
const app = createApp({
  rootElement: '#app'
});

// 使用路由插件
app.use(router);

// 挂载应用
app.mount();

// 导航示例
setTimeout(() => {
  console.log('Navigating to about page');
  router.push('/about');
}, 2000);

setTimeout(() => {
  console.log('Navigating to user page');
  router.push({ name: 'user', params: { id: 123 } });
}, 4000);

setTimeout(() => {
  console.log('Going back');
  router.back();
}, 6000);
```

## 注意事项

### History 模式配置

在 History 模式下，需要服务器配置支持，以避免页面刷新时出现 404 错误：

#### Nginx 配置

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Apache 配置

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 路由参数变化

当路由参数发生变化时（例如从 `/user/1` 导航到 `/user/2`），组件不会重新挂载，但会触发 `beforeRouteUpdate` 守卫：

```typescript
class UserComponent extends Component {
  protected initState() {
    return {
      userId: '',
      userData: null
    };
  }

  protected onMounted() {
    this.loadUserData();
  }

  protected beforeRouteUpdate(to, from, next) {
    // 路由参数变化时重新加载数据
    this.loadUserData();
    next();
  }

  protected loadUserData() {
    const userId = this.router.currentRoute.params.id;
    this.state.userId = userId;
    
    // 模拟 API 请求
    setTimeout(() => {
      this.state.userData = {
        id: userId,
        name: `User ${userId}`
      };
    }, 500);
  }
}
```

### 导航取消

您可以通过 `next(false)` 取消导航：

```typescript
router.beforeEach((to, from, next) => {
  if (to.path === '/protected' && !isAuthenticated()) {
    // 取消导航
    next(false);
  } else {
    next();
  }
});
```

## 总结

Free-JS 的路由系统提供了一种简洁、灵活的方式来管理应用的导航和页面切换。通过理解和掌握路由 API，您可以创建更加复杂、功能丰富的单页应用。
