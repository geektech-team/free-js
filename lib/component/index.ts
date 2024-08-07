import { reactive } from "../core/reactive";
import { Element } from "../element/element";

export class Component {
    constructor() {
        if(this.data) reactive(this.data);
    }
    public data: any;
    public parent: Element | Component | null = null;
    public children: Array<Element | Component | string> = [];
    render(children?: Array<Element | Component | string>) {
        this.parent?.render(children);
    }
}