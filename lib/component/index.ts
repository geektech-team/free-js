import { Element } from "../element/element";

export class Component {
    public parent: Element | Component | null = null;
    public children: Array<Element | Component | string> = [];
    render(children?: Array<Element | Component | string>) {
        this.parent?.render(children);
    }
}