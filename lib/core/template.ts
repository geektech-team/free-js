import { effect } from './reactive';

export interface TemplateBinding {
  node: Text;
  key: string;
  value: any;
}

export class TemplateEngine {
  private bindings: TemplateBinding[] = [];

  constructor(private state: any) {}

  public parseTemplate(text: string): Text {
    const textNode = document.createTextNode('');
    const matches = text.match(/{{(.*?)}}/g);
    
    if (matches) {
      matches.forEach(match => {
        const key = match.slice(2, -2).trim();
        const value = this.state[key];
        const updatedText = text.replace(match, value);
        textNode.textContent = updatedText;

        this.bindings.push({
          node: textNode,
          key,
          value
        });

        effect(() => {
          const newValue = this.state[key];
          const newText = text.replace(match, newValue);
          textNode.textContent = newText;
        });
      });
    } else {
      textNode.textContent = text;
    }

    return textNode;
  }

  public clearBindings(): void {
    this.bindings = [];
  }
} 