const express = require("express");
const server = require( "./server");

const PORT = 3000;
let webServer = express();
//===================================================

webServer.get('/Request',(request,response)=>{
    console.log("Request from IP:"+request.ip);
    console.log(request.query);
    if (!request.query.product){
        console.log("No Product!");
        response.send({result:"Fail",error:"No Product"});
    }
    else
    {
        server.newRequest("Web",request.query.id,request.query.product,()=>{
            response.send({result:"Registred"}); 
        })
    }
    
});

webServer.get('/getResult',(request,response)=>{
    console.log("Request from IP:"+request.ip);
    console.log(request.query);
    if (!request.query.id){
        console.log("No Product!");
        response.send({result:"Fail",error:"No Product"});
    }
    else
    {
        server.getResult(request.query.id,(result)=>{
            
        response.send(result);
        })
    }
    
})

webServer.get('*',(request,response)=>{
    response.send('404');
})

//===================================================
const launch = (port) => {
    webServer.listen(port, ()=>{

    console.log("Express fired on port "+port);
    })
}
launch(PORT);
