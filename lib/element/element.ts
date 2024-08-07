import { Component } from "../component";

export abstract class Element {
    public parent: Element | null = null;
    public tagName: string = '';
    public $dom: HTMLElement;
    public children: Array<Element | Component | string> = [];
    constructor(options: { 
        children: Array<Element | Component | string>, 
        $dom?: HTMLElement | null, 
        tagName?: keyof HTMLElementTagNameMap, 
        click?: (this: HTMLElement, ev: MouseEvent) => any
    }) {
        this.$dom = options.$dom ?? document.createElement(options.tagName as keyof HTMLElementTagNameMap);
        if(options.click) {
            this.$dom.addEventListener('click', options.click);
        } 
        this.children = options.children ?? [];
    }
    render(children?: Array<Element | Component | string>) {
        const elements = children ?? this.children;
        elements.forEach(child => {
            if (typeof child === 'string') {
                this.$dom.append(child);
            } else if (child instanceof Component) {
                child.parent = this;
                this.render(child.children)
            } else if (child instanceof Element) {
                child.parent = this;
                this.$dom.append(child.render())
            }
        });
        return this.$dom;
    }
}