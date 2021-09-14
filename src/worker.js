const {Pool} = require("pg");
const fs = require("fs");
const { v1: uuidv1 } = require("uuid");
const chalk = require("chalk");

const pgsql = require("./pgsql");
const log = require("./log");


const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());
var grabCount = 2;
var WORKERNAME = uuidv1();
var INTERVAL = 3000;
var COOLDOWN = 20;
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
const markRequest = (callback)=>{
    pgsql.query("UPDATE sublog set worker = '"+WORKERNAME+"' where product in (SELECT product from sublog where (worker is null or worker = '"+WORKERNAME+"') and rep is null order by id limit "+grabCount+" )",()=>{
        if(callback) callback();
    })
}
const getRequests = (callback)=>{
        pgsql.query("select * from sublog where worker='"+WORKERNAME+"' and rep is null and snd is null",(err,res)=>{
            if(err || !res || !res.rows){
                log.timestamp("No Requests " && err);
                if(callback) callback(undefined);
            }
            pgsql.query("Update sublog set snd = CURRENT_TIMESTAMP where snd is null and worker='"+WORKERNAME+"'",(err,res)=>{
              
            })
            pgsql.query("Update sublog set snd = null where snd is not null and rep is null and worker='"+WORKERNAME+"' and extract(epoch from CURRENT_TIMESTAMP-snd) > "+COOLDOWN,(err,res)=>{
            })

            if(callback) callback(res.rows);
        })
    };
    
const workRequest = (request,callback)=>{
    let skillNeeded;
    let currentSkill = {skillValue:0};
    if(!request) {callback("No Request",undefined)}
    recipes.forEach((recipe)=>{
        if (recipe.recipeName == request.product){
            skillNeeded = recipe.skill;
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
    log.timestamp('WorkRequest '+request.product+': '+Math.min(20-currentSkill.skillValue,1000)*1000+' msec...');
    // log.timestamp(currentSkill);
    setTimeout(()=>{
        log.timestamp("Work Complete! "+chalk.green(request.product));
        callback("success");
    },Math.min(20-currentSkill.skillValue,1000)*1000
    )   
}
const markComplete = (request,callback)=>{
    pgsql.query("update sublog set rep=CURRENT_TIMESTAMP where worker='"+WORKERNAME+"' and id = '"+request.id+"' and product='"+request.product+"'")
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
            pgsql.inventoryCheck(component,(checkResult)=>{
                if (checkResult == false) {
                    log.timestamp("Not Enough "+chalk.red(component) +" for " + chalk.yellow(product));
                    missing = true;
                    if (callback) callback("Not enough components")
                    
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
                pgsql.inventoryTake(component, (takeResult) => {
                 
                });
              });
            }
            log.timestamp("Enough for " + chalk.green(product));
            if (callback) callback("success");
          }  
      },1000)

    }
  });
};


const loop = () =>{
    setInterval(()=>{
        markRequest(()=>{
            getRequests((requests)=>{
                if (requests){
                requests.forEach((request)=>{
                    // log.timestamp(request);
                    takeNeeded(request.product,(takeResult)=>{
                        log.timestamp("Took for "+request.product+': '+takeResult)
                        if (takeResult=="success")
                            workRequest(request,()=>{
                                pgsql.inventoryPut(request.product);
                                markComplete(request);
                            })
                    });
                    
                })
            }
            })
        });
        pgsql.closeDoneReqs();
        updateWorker();
    },INTERVAL);
}

initWorker();
log.cls("SIMCRAFT WORKER",WORKERNAME);

loop();
// process.on('exit',finishWorker());
