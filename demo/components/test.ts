import { Component } from "../../lib/component";
import { Div } from "../../lib/element/div";

export class Test extends Component {
    children = [
        'test-component',
        new Div()
    ]
}