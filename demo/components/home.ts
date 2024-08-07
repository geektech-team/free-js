import { Component } from "../../lib/component";
import { Div } from "../../lib/element/div";
import { Button } from "../../lib/element/button";

export class Home extends Component {
    data = {
        count: 1
    }
    children = [
        `count: ${this.data.count}`,
        new Button({
            children: ['+1'],
            click: () => {
                console.log('click')
                this.data.count++;
            },
            // style: {
            //     backgroundColor: 'white',
            //     border: 'none'
            // }
        }),
        new Div()
    ]
    constructor(){
        debugger
        super();
    }
}