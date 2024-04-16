export class Element {
    constructor(public elements: Element[]) {
    }
    unshift(element: Element) {
        this.elements.unshift(element);
    }
}