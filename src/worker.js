const pgsql = require("./pgsql");
const {Pool} = require("pg");
const fs = require("fs");


const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());

var WORKERNAME = "WORKER1";
var INTERVAL = 3000;

var skills = [];

const initWorker = ()=>{
    pgsql.query("insert into workers(worker,update) ('"+WORKERNAME+"',CURRENT_TIMESTAMP)")
}

const updateWorker = ()=>{
    pgsql.query("update workers set update = CURRENT_TIMESTAMP where worker='"+WORKERNAME+"'")
}
const finishWorker = ()=>{
    pgsql.query("delete from workers where worker='"+WORKERNAME+"'")
}

const markRequest = (callback)=>{
    pgsql.query("update sublog set worker = '"+WORKERNAME+"' where worker in ('','"+WORKERNAME+"') and rep is null",()=>{
        if(callback) callback();
    })
}
const getRequest = (callback)=>{
    pgsql.query("select * from sublog where worker='"+WORKERNAME+"'",(err,res)=>{
        if(!res){

        }
        
        if(callback) callback(res);
    })
}
const workRequest = (request,callback)=>{
    if(!request) {callback("No Request",undefined)}
    recipes.forEach((recipe)=>{
        if (recipe.recipeName == request.product){
            skillNeeded = recipe.skill;
        }
    })
    let hasSkill = skills.indexOf(skillNeeded);
    if (hasSkill == -1){
        let newSkill = {
            skill:skillNeeded,
            skillValue:0
        }
        skills.add(newSkill);
        currentSkill = newSkill;
    }
    else{
        currentSkill = skills[hasSkill];
        skills[hasSkill].skillValue++;
    }

    setTimeout(()=>{
        callback(undefined,undefined);
    },20-currentSkill.skillValue)

    
}
const markComplete = (callback)=>{
    pgsql.query("update sublog set rep=CURRENT_TIMESTAMP where worker='"+WORKERNAME+"'")
}

const loop = () =>{
    setInterval(()=>{
        markRequest(()=>{
            getRequest((request)=>{
                workRequest(request,()=>{
                    inventoryPut(request.product);
                    markComplete();
                })
            })
        });
        updateWorker();
    },INTERVAL);
}

initWorker();
loop();

