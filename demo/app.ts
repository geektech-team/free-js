import { Div } from "../lib/element/div";
import App from "../lib/core/app";
import { Test } from "./components/test";

export default class AppContainer implements App {
    public children = [
        new Test(),
        new Div({children:[
            'text1',
            new Div()
        ]}),
        'text2',
    ]
    // constructor() {
    //     this.children = [
    //         new Test({parent: this}),
    //         new Div({children:[
    //             'text1',
    //             new Div()
    //         ]}),
    //         'text2',
    //     ]
    // }
    // render(container: HTMLElement | null) {
    //     return [
    //         new Div({parent: container}).render([
    //             'text',
    //             new Div()
    //         ])
    //     ];
    // }
}