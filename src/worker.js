const {Pool} = require("pg");
const fs = require("fs");
const chalk = require("chalk");
const { v1: uuidv1 } = require("uuid");

const pgsql = require("./pgsql");
const log = require("./log");
const server = require("./server");


const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());
var grabCount = 10;
var WORKERNAME = uuidv1();
var INTERVAL = 3000;
var COOLDOWN = 20;
var defaultSkill = 5;
var skills = [];

const initWorker = ()=>{
    pgsql.query("insert into workers(worker,update) values ('"+WORKERNAME+"',CURRENT_TIMESTAMP)")
}

const updateWorker = ()=>{
    pgsql.query("update workers set update = CURRENT_TIMESTAMP where worker='"+WORKERNAME+"'")
}
const finishWorker = ()=>{
    log.timestamp ("Finish Worker");
    pgsql.query("delete from workers where worker='"+WORKERNAME+"'")
}
// id у всех одинаковые
const markOrder = (callback)=>{
    pgsql.query("UPDATE orders set worker = '"+WORKERNAME+"' where orderid in (SELECT orderid from orders where (worker is null or worker = '"+WORKERNAME+"') and rep is null order by snd limit "+grabCount+" )",()=>{
        if(callback) callback();
    })
}
const unmarkOrder = (orderid,callback)=>{
    pgsql.query("UPDATE orders set worker = null,snd = null where orderid='"+orderid+"'");
}

const getRequests = (callback)=>{
        pgsql.query("select * from orders where worker='"+WORKERNAME+"' and rep is null and snd is null",(err,res)=>{
            if(err || !res || !res.rows){
                log.timestamp("No Requests " && err);
                if(callback) callback(undefined);
            }
            pgsql.query("Update orders set snd = CURRENT_TIMESTAMP where snd is null and worker='"+WORKERNAME+"'",(err,res)=>{
              
            })
            pgsql.query("Update orders set snd = null where snd is not null and rep is null and worker='"+WORKERNAME+"' and extract(epoch from CURRENT_TIMESTAMP-snd) > "+COOLDOWN,(err,res)=>{
            })

            if(callback) callback(res.rows);
        })
    };
    
const workRequest = (request,callback)=>{
    let skillNeeded;
    let components;
    let currentSkill = {skillValue:0};
    if(!request) {callback("No Request",undefined)}
    recipes.forEach((recipe)=>{
        if (recipe.recipeName == request.product){
            skillNeeded = recipe.skill;
            components = recipe.components;
        }
    })
    if (skillNeeded){
        let hasSkill = skills.indexOf(skillNeeded);
        if (hasSkill == -1){
            let newSkill = {
                skill:skillNeeded,
                skillValue:0
            }
            skills.push(newSkill);
            currentSkill = newSkill;
        }
        else{
            currentSkill = skills[hasSkill];
            skills[hasSkill].skillValue++;
        }
    }
    
  //  log.timestamp(request);
    log.timestamp('WorkRequest '+request.product+': '+Math.min(defaultSkill-currentSkill.skillValue,1000)*1000+' msec...');
    // log.timestamp(currentSkill);
    setTimeout(()=>{
        log.timestamp("Work Complete! "+chalk.green(request.product));
        callback("success");
    },Math.min(defaultSkill-currentSkill.skillValue,1000)*1000
    )   
}
const markComplete = (order,callback)=>{
    pgsql.query("update orders set rep=CURRENT_TIMESTAMP where worker='"+WORKERNAME+"' and orderid = '"+order.orderid+"'");
}

const takeNeeded = (product, callback) => {
  recipes.forEach((recipe) => {
    if (recipe.recipeName == product) {
      let enough,componentsCount,missing;
      enough = 0;
      componentsCount = 0;
      missing = false;
      
      if (recipe.components) {
        componentsCount=recipe.components.length;
        recipe.components.forEach((component) => {
            server.inventoryCheck(component,(checkResult)=>{
                if (checkResult == false) {
                    log.timestamp("Not Enough "+chalk.red(component) +" for " + chalk.yellow(product));
                    server.placeOrder(component);
                    missing = true;
                    if (callback) callback("Not enough components");
                    
                  }
                else {
                    enough++;
                }
            })
         
        });
      }
      // wait each component?
     const waitForCheckComponents = setInterval(()=>{
        if (missing == true)
        {
            clearInterval(waitForCheckComponents);
           // log.timestamp("Take failed for " + product);
            if (callback) callback("Not enough components");
        }
        if (enough == componentsCount) {
            
            clearInterval(waitForCheckComponents);
            if (recipe.components) {
              recipe.components.forEach((component) => {
                server.inventoryTake(component, (takeResult) => {
                  if (!takeResult) missing = true;
                });
              });
            }
            log.timestamp("Enough for " + chalk.green(product));
            if (callback && !missing) callback("success");
          }  
      },1000)

    }
  });
};


const loop = () =>{
    setInterval(()=>{
        markOrder(()=>{
            getRequests((requests)=>{
                if (requests){
                requests.forEach((order)=>{
                    // log.timestamp(request);
                    takeNeeded(order.product,(takeResult)=>{
                        if (takeResult=="success"){
                            log.timestamp("Took for "+order.product+': '+takeResult);
                            workRequest(order,()=>{
                                server.inventoryPut(order.product);
                                markComplete(order);
                            })}
                        else{
                            unmarkOrder(order.orderid);
                            ;
                        }
                    });
                    
                })
            }
            })
        });
        
        updateWorker();
    },INTERVAL);
}

initWorker();
log.cls("SIMCRAFT WORKER",WORKERNAME);

loop();
// process.on('exit',finishWorker());
