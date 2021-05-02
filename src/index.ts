import express from "express";

const PORT = 80;
let port : number;
let webServer = express();
//===================================================

webServer.get('/express',(request,response)=>{
    console.log("Request from IP:"+request.ip);
response.send(request.query);
});

//===================================================
const launch = (port) => {
    webServer.listen(port, ()=>{

    console.log("Express fired on port "+port);
    })
}
launch(PORT);
