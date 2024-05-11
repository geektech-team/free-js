import { FreeApp } from "../lib";
import { Div } from "../lib/element/div";
import { Router } from "../lib/router";

const app = new FreeApp();
const router = new Router([{
    name: "home",
    path: "/",
    component: new Component({
        name: "home",
        elements: [
            new Div([
                "Hello World"
            ])
        ]
    })
}]);
app.use(router);
app.run();