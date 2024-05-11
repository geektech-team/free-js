import { Container } from "./core/container";

export class FreeApp {
    public title: string;
    constructor(options: {
        title: string;
    }) {
        this.title = options.title;
    }
    use(pligin) {
        pligin.install(this)
    }
    compile() {
        const container = new Container({title: this.title});
    }
    run(){
        this.compile();
        console.log('run')
    }
}