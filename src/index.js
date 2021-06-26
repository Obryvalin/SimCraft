const express = require("express");
const { v1: uuidv1 } = require("uuid");

const server = require( "./server");
const pgsql = require("./pgsql");
const log = require("./log");

const PORT = 3000;
let webServer = express();
//===================================================

webServer.get('/Request',(request,response)=>{
    log.timestamp("Request from IP:"+request.ip);
    log.timestamp(request.query);
    if (!request.query.product){
        log.timestamp("No Product!");
        response.send({result:"Fail",error:"No Product"});
    }
    else
    {
        let id = uuidv1();
        server.newRequest("Web",id,request.query.product,()=>{
            response.send({result:"Registred",id}); 
        })
    }
    
});

webServer.get('/getResult',(request,response)=>{
    log.timestamp("Request from IP:"+request.ip);
    log.timestamp(request.query);
    if (!request.query.id){
        log.timestamp("No Product!");
        response.send({result:"Fail",error:"No Product"});
    }
    else
    {
        server.getResult(request.query.id,(result)=>{
            
        response.send(result);
        })
    }
    
})
webServer.get('/inventoryTake',(request,response)=>{
    log.timestamp("Request inventoryTake"+request.query.product);
    if(!request.query.product){
        log.timestamp("No Product!");
        response.send({result:"Fail",error:"No Product"});
    }
    else{
        pgsql.inventoryTake(request.query.product,(takeResult)=>{
            if (takeResult){
                response.send({result:"Success"});
            }
            else{
                log.timestamp("No Product in inventory!");
                response.send({result:"Fail",error:"No Product in inventory"});
            }
        })
        
    }
})

webServer.get('/inventoryPut',(request,response)=>{
    log.timestamp("Request inventoryPut "+request.query.product);
    if(!request.query.product){
        log.timestamp("No Product!");
        response.send({result:"Fail",error:"No Product"});
    }
    else{
        pgsql.inventoryPut(request.query.product);
        response.send({result:"Success",product:request.query.product});
    }
        
})



webServer.get('/Show',(request,response)=>{
    log.timestamp("Request Show "+request.query.entity);
    if(!request.query.entity){
        log.timestamp("No Entity!");
        response.send({result:"Fail",error:"No Entity"});
    }

    pgsql.query("select * from "+request.query.entity,(err,result)=>{
        if (err) {
            log.timestamp(err);
        }
        if (result.rows)
        {
            // log.timestamp(result.rows);
            response.send(result.rows);
        }
        else {
            response.send({result:"Empty"});
        }
    })
})


webServer.get('*',(request,response)=>{
    response.send('404');
})

//===================================================
const launch = (port) => {
    webServer.listen(port, ()=>{

    log.timestamp("Express fired on port "+port);
    })
}
launch(PORT);
