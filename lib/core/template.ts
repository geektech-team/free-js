import { effect } from './reactive';

export interface TemplateBinding {
  node: Text;
  key: string;
  originalText: string;
}

export class TemplateEngine {
  private bindings: TemplateBinding[] = [];
  private readonly templateRegex = /{{(.*?)}}/g;

  constructor(private state: any) {
    if (!state || typeof state !== 'object') {
      throw new Error('TemplateEngine requires a valid state object');
    }
  }

  /**
   * 解析模板字符串，创建响应式的文本节点
   * @param text 包含模板表达式的文本字符串
   * @returns 创建的文本节点
   */
  public parseTemplate(text: string): Text {
    if (typeof text !== 'string') {
      text = String(text);
    }

    const textNode = document.createTextNode('');
    const matches = text.match(this.templateRegex);

    if (matches && matches.length > 0) {
      this.setupReactiveBindings(textNode, text, matches);
    } else {
      // 如果没有模板表达式，直接设置文本内容
      textNode.textContent = text;
    }

    return textNode;
  }

  /**
   * 设置响应式绑定
   */
  private setupReactiveBindings(
    node: Text,
    originalText: string,
    matches: RegExpMatchArray
  ): void {
    // 存储所有需要监控的键
    const keys = new Set<string>();

    // 第一次计算并设置文本内容
    const initialText = this.evaluateTemplate(originalText, matches, keys);
    node.textContent = initialText;

    // 为每个键创建绑定记录
    matches.forEach((match) => {
      const key = match.slice(2, -2).trim();
      if (key) {
        this.bindings.push({
          node,
          key,
          originalText,
        });
      }
    });

    // 创建响应式effect，当任何相关的状态变化时更新文本
    effect(() => {
      try {
        const updatedText = this.evaluateTemplate(originalText, matches, keys);
        if (node.textContent !== updatedText) {
          node.textContent = updatedText;
        }
      } catch (error) {
        console.error('Template update error:', error);
        node.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    });
  }

  /**
   * 计算模板文本的值
   */
  private evaluateTemplate(
    text: string,
    matches: RegExpMatchArray,
    keys: Set<string>
  ): string {
    let result = text;

    matches.forEach((match) => {
      const key = match.slice(2, -2).trim();
      keys.add(key);

      // 尝试获取状态值
      const value = this.getValueFromState(key);
      // 将undefined或null转换为空字符串
      const displayValue =
        value === undefined || value === null ? '' : String(value);
      result = result.replace(match, displayValue);
    });

    return result;
  }

  /**
   * 从状态对象中获取值，支持嵌套属性访问
   */
  private getValueFromState(keyPath: string): any {
    if (!keyPath) return undefined;

    // 支持嵌套属性访问，如 'user.name'
    const keys = keyPath.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * 清除所有模板绑定
   */
  public clearBindings(): void {
    this.bindings = [];
  }

  /**
   * 获取当前的绑定数量
   */
  public getBindingCount(): number {
    return this.bindings.length;
  }

  /**
   * 检查模板是否包含表达式
   */
  public hasExpressions(text: string): boolean {
    return this.templateRegex.test(text);
  }

  /**
   * 获取模板中的所有表达式键
   */
  public extractKeys(text: string): string[] {
    const keys: string[] = [];
    let match;
    const regex = new RegExp(this.templateRegex, 'g');

    while ((match = regex.exec(text)) !== null) {
      const key = match[1]?.trim();
      if (key) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * 计算模板值
   */
  public evaluateTemplateValue(text: string): string {
    const matches = text.match(this.templateRegex);
    if (!matches) {
      return text;
    }

    const keys = new Set<string>();
    return this.evaluateTemplate(text, matches, keys);
  }
}