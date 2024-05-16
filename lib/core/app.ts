import { Component } from "../component";
import { Element } from "../element/element";

export default interface App {
    children: Array<Element | Component | string>;
}