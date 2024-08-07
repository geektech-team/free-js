import { Div } from "../lib/element/div";
import App from "../lib/core/app";
import { Home } from "./components/home";

export default class AppContainer implements App {
    public children = [
        new Home(),
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