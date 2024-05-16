import { Component } from "../component";
import { Element } from "../element/element";

export class Container extends Element {
    constructor(options: {
        title: string;
        children: Array<Element | Component | string>
    }) {
        document.title = options.title;
        super({
            children: options.children, 
            $dom: document.getElementById('app') as HTMLElement
        });
    }
}