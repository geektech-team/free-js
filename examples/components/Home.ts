import { Component, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';
import { Navigation } from './Navigation';
import { TextInput } from './TextInput';

interface NavLink {
  path: string;
  text: string;
}

export class Home extends Component {
  protected initState() {
    return {
      title: '欢迎使用 Free Framework',
      navigationLinks: [
        { path: '/', text: '首页' },
        { path: '/counter', text: '计数器' },
        { path: '/about', text: '关于' }
      ],
      lastNavigation: '',
      inputValue: '',
    };
  }

  protected initStyles(): void {
    const homeStyles: StyleOptions = {
      selector: '.home',
      properties: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }
    };

    const titleStyles: StyleOptions = {
      selector: '.home h1',
      properties: {
        fontSize: '2.5em',
        color: '#2c3e50',
        marginBottom: '20px'
      }
    };

    const contentStyles: StyleOptions = {
      selector: '.home .content',
      properties: {
        marginTop: '30px',
        fontSize: '1.2em',
        color: '#666'
      }
    };

    const navigationInfoStyles: StyleOptions = {
      selector: '.home .navigation-info',
      properties: {
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        color: '#666',
        fontSize: '0.9em'
      }
    };

    const messageItemStyles: StyleOptions = {
      selector: '.home .message-item',
      properties: {
        padding: '8px',
        margin: '4px 0',
        backgroundColor: '#fff',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'left'
      }
    };

    this.styleManager.addStyle('home', homeStyles);
    this.styleManager.addStyle('title', titleStyles);
    this.styleManager.addStyle('content', contentStyles);
    this.styleManager.addStyle('navigationInfo', navigationInfoStyles);
    this.styleManager.addStyle('messageItem', messageItemStyles);
  }

  private handleNavigation(path: string): void {
    this.state.lastNavigation = `上次导航到: ${path} (${new Date().toLocaleTimeString()})`;
  }

  private handleInputChange(value: string): void {
    this.state.inputValue = value;
  }


  protected render(): VNode {
    return {
      tag: 'div',
      props: { class: 'home' },
      children: [
        {
          tag: 'h1',
          props: {},
          children: ['{{title}}']
        },
        {
          component: Navigation,
          props: {
            links: this.state.navigationLinks,
            onNavigate: (path: string) => this.handleNavigation(path)
          },
          children: []
        },
        {
          tag: 'div',
          props: { class: 'content' },
          children: [
            '这是一个轻量级的前端框架示例，展示了组件化、响应式状态管理、路由等功能。'
          ]
        },
        {
          component: TextInput,
          props: {
            value: this.state.inputValue,
            placeholder: '请输入消息...',
            label: '消息',
            onChange: (value: string) => this.handleInputChange(value),
          },
          children: []
        },
        {
          tag: 'div',
          props: { class: 'navigation-info' },
          children: ['{{lastNavigation}}']
        },
        {
          tag: 'div',
          children: ['{{inputValue}}']
        },
        {
          tag: 'div',
          children: [this.state.inputValue]
        }
      ]
    };
  }
} 