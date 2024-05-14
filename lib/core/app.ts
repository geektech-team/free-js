import { Element } from "../element/element";

export default interface App {
    elements: Array<Element | string>;
}