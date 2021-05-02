"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PORT = 80;
let port;
let webServer = express_1.default();
//===================================================
webServer.get('/express', (request, response) => {
    console.log("Request from IP:" + request.ip);
    response.send(request.query);
});
//===================================================
const launch = (port) => {
    webServer.listen(port, () => {
        console.log("Express fired on port " + port);
    });
};
launch(PORT);
