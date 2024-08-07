import { Element } from "./element";

export class Button extends Element {
    constructor(options?: { children: (string | Element)[], click?: (this: HTMLElement, ev: MouseEvent) => any }) {
        super({
            children: options?.children ?? [],
            tagName: 'button',
            click: options?.click
        });
    }
}