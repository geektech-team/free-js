import { Div } from "../lib/element/div";
import App from "../lib/core/app";

export default class AppContainer implements App {
    public elements = [
        new Div({elements:[
            'text1',
            new Div()
        ]}),
        'text2',
    ]
    // render(container: HTMLElement | null) {
    //     return [
    //         new Div({parent: container}).render([
    //             'text',
    //             new Div()
    //         ])
    //     ];
    // }
}