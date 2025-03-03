import { Router, createRouter } from '../index';
import { FreeApp } from '../../core/app';
import { Component } from '../../core/component';
import { useRouter } from '../instance';
import { VNode } from '../../core/vnode';

// 模拟组件类
class TestHomeComponent extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    // 测试组件不需要样式
  }

  render(): VNode {
    return {
      tag: 'div',
      props: { id: 'home' },
      children: ['Home Page']
    };
  }
}

class TestAboutComponent extends Component {
  protected initState(): object {
    return {};
  }

  protected initStyles(): void {
    // 测试组件不需要样式
  }

  render(): VNode {
    return {
      tag: 'div',
      props: { id: 'about' },
      children: ['About Page']
    };
  }
}

// 模拟 window.location 和 history
const mockPushState = jest.fn();

Object.defineProperty(window, 'location', {
  value: { pathname: '/' },
  writable: true
});

Object.defineProperty(window.history, 'pushState', {
  value: mockPushState
});

describe('Router', () => {
  let router: Router;
  let app: FreeApp;

  describe('路由实例管理', () => {

    it('未安装时useRouter应该抛出错误', () => {
      expect(() => useRouter()).toThrow('Router is not initialized');
    });
    
    it('安装后应该可以通过useRouter访问', () => {
      router.install(app);
      expect(useRouter()).toBe(router);
    });
  });
    
  beforeEach(() => {
    // 重置所有的mock
    jest.clearAllMocks();
    
    // 初始化路由
    router = createRouter({
      routes: [
        { path: '/', component: TestHomeComponent },
        { path: '/about', component: TestAboutComponent }
      ]
    });

    // 创建应用实例
    app = new FreeApp();
  });

  describe('createRouter', () => {
    it('应该正确创建路由实例', () => {
      expect(router).toBeInstanceOf(Router);
    });

    it('应该包含配置的路由', () => {
      expect(router['routes']).toHaveLength(2);
      expect(router['routes'][0].path).toBe('/');
      expect(router['routes'][1].path).toBe('/about');
    });
  });

  describe('路由导航', () => {
    beforeEach(() => {
      router.install(app);
    });

    it('应该正确处理路由跳转', () => {
      router.push('/about');
      expect(mockPushState).toHaveBeenCalledWith({}, '', '/about');
    });

    it('当路径不存在时应该跳转到根路由', () => {
      window.location.pathname = '/non-existent';
      router.install(app);
      expect(mockPushState).toHaveBeenCalledWith({}, '', '/');
    });
  });

});