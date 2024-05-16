import { Element } from "./element";

export class Div extends Element {
    constructor(options?: { children: (string | Element)[] }) {
        super({
            children: options?.children ?? [],
            tagName: 'div'
        });
    }
}