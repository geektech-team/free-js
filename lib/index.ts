import App from "./core/app";
import { Container } from "./core/container";
import { Element } from "./element/element";

export class FreeApp {
    public title: string;
    constructor(options: {
        title: string;
        app: App;
    }) {
        this.title = options.title;
        const container = new Container({title: this.title, elements: options.app.elements});
        container.render();
    }
    use(pligin: any) {
        pligin.install(this)
    }
    compile() {
        // container.render()
    }
    run(){
        // this.compile();
        console.log('run')
    }
}