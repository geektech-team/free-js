import { FreeApp } from "../lib";
import { Div } from "../lib/element/div";
import { Router } from "../lib/router";
import App from "./app";

const app = new FreeApp({
    title: "FreeApp",
    app: new App()
});
// const router = new Router([{
//     name: "home",
//     path: "/",
//     component: new Component({
//         name: "home",
//         elements: [
//             new Div([
//                 "Hello World"
//             ])
//         ]
//     })
// }]);
// app.use(router);
app.run();