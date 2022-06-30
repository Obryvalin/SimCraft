const express = require("express");
const { v1: uuidv1 } = require("uuid");
const hbs = require("hbs");
const path = require("path");
const server = require( "./server");
const pgsql = require("./pgsql");
const log = require("./log");

const PORT = process.env.port || 3000;
let webServer = express();
//===================================================
webServer.set("view engine", "hbs"); // без этого hbs на express не работает
webServer.set("views", path.join(__dirname, "../templates/views")); // где hbs лежат
hbs.registerPartials(path.join(__dirname, "../templates/partials"));

webServer.use(express.static(path.join(__dirname, "../public")));
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
        server.inventoryTake(request.query.product,(takeResult)=>{
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
        server.inventoryPut(request.query.product);
        response.send({result:"Success",product:request.query.product});
    }
        
})

webServer.get('/Inventory',(request,response)=>{
    response.render('inventoryPut');
}

)

webServer.get('/db/:table',(request,response)=>{
    log.timestamp("Request Show "+request.query.entity);
    if(!request.params.table){
        log.timestamp("No Entity!");
        response.send({result:"Fail",error:"No Entity"});
    }

    pgsql.query("select * from "+request.params.table,(err,result)=>{
        if (err) {
            log.timestamp(err);
            response.send({result:"Fail",error:"No Entity in Database"});
        }
        else{
            if (result && result.rows)
            {
                // log.timestamp(result.rows);
                response.send(result.rows);
            }
            else {
                response.send({result:"Empty"});
            }
        }
       
    })
})

webServer.get('/Recipes',(request,response)=>{
    log.timestamp("Request Recipes");
    response.send(server.getRecipes());
})


webServer.get('*',(request,response)=>{
    response.sendStatus(200);
})

//===================================================
const launch = (port) => {
    webServer.listen(port, ()=>{

    log.timestamp("Express fired on port "+port);
    })
}

launch(PORT);
setInterval(()=>{
    log.cls("SIMCRAFT SERVER","SERVER");
    server.getLog(res=>{
        console.table(res);
    });
    server.killOldWorkers(()=>{
        //console.log("Killed");
    });//===================================================

    server.finishRequest(()=>{
        //console.log("finished");
    });
    
    
},3000);
