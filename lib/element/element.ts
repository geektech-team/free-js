export abstract class Element {
    public parent: Element | null = null;
    public tagName: string = '';
    public $dom: HTMLElement;
    public elements: Array<Element | string> = [];
    constructor(options: { elements: Array<Element | string>, $dom?: HTMLElement | null, tagName?: keyof HTMLElementTagNameMap }) {
        this.$dom = options.$dom ?? document.createElement(options.tagName as keyof HTMLElementTagNameMap);
        this.elements = options.elements ?? [];
    }
    render() {
        this.elements.forEach(element => {
            if (typeof element === 'string') {
                // parent.append;
                this.$dom.append(element);
            } else {
                this.$dom.append(element.render())
            }
        });
        return this.$dom;
    }
    unshift(element: Element) {
       this.elements.unshift(element);
    }
}