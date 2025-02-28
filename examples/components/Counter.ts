import { Component, VNode, reactive } from '../../lib';
import { StyleOptions } from '../../lib/style/StyleManager';

export class Counter extends Component {
  protected initState() {
    return {
      count: 0
    }
  }

  protected initStyles(): void {
    const counterStyles: StyleOptions = {
      selector: '.counter',
      properties: {
        maxWidth: '400px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        textAlign: 'center'
      },
      media: {
        '(max-width: 768px)': {
          maxWidth: '100%',
          margin: '10px'
        }
      }
    };

    const buttonStyles: StyleOptions = {
      selector: '.counter button',
      properties: {
        padding: '8px 16px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      },
      hover: {
        background: '#45a049'
      }
    };

    this.styleManager.addStyle('counter', counterStyles);
    this.styleManager.addStyle('button', buttonStyles);
  }

  protected render(): VNode {
    return {
      tag: 'div',
      props: { class: 'counter' },
      children: [
        {
          tag: 'h2',
          props: {},
          children: ['计数器: {{count}}']
        },
        {
          tag: 'button',
          props: {},
          listeners: {
            click: () => {
              this.state.count++;
            }
          },
          children: ['增加']
        }
      ]
    };
  }
} 