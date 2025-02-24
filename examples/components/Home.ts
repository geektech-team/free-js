import { Component, VNode } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';
import { useRouter } from '../../lib/router/instance';

export class Home extends Component {
  protected initState() {
    return {
      title: '欢迎使用 Free Framework'
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

    const linkStyles: StyleOptions = {
      selector: '.home .nav-link',
      properties: {
        display: 'inline-block',
        padding: '10px 20px',
        margin: '10px',
        color: '#fff',
        backgroundColor: '#42b983',
        borderRadius: '4px',
        textDecoration: 'none',
        transition: 'background-color 0.3s'
      },
      hover: {
        backgroundColor: '#3aa876'
      }
    };

    this.styleManager.addStyle('home', homeStyles);
    this.styleManager.addStyle('title', titleStyles);
    this.styleManager.addStyle('link', linkStyles);
  }

  protected render(): VNode {
    const router = useRouter();
    
    return {
      type: 'div',
      props: { class: 'home' },
      children: [
        {
          type: 'h1',
          props: {},
          children: ['{{title}}']
        },
        {
          type: 'div',
          props: {},
          children: [
            {
              type: 'a',
              props: { 
                class: 'nav-link',
                href: '/counter'
              },
              listeners: {
                click: (e: Event) => {
                  e.preventDefault();
                  router.push('/counter');
                }
              },
              children: ['查看计数器示例']
            }
          ]
        }
      ]
    };
  }
} 