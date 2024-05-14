import { Element } from "../element/element";

export class Container extends Element {
    constructor(options: {
        title: string;
        elements: Array<Element | string>
    }) {
        document.title = options.title;
        super({
            elements: options.elements, 
            $dom: document.getElementById('app') as HTMLElement
        });
    }
}