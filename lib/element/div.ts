import { Element } from "./element";

export class Div extends Element {
    constructor(options?: { elements: (string | Element)[] }) {
        super({
            elements: options?.elements ?? [],
            tagName: 'div'
        });
    }
}