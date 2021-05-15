const pgsql = require("./pgsql");
const {Pool} = require("pg");
const fs = require("fs");


const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());
var grabCount = 2;
var WORKERNAME = "WORKER1";
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
    console.log ("Finish Worker");
    pgsql.query("delete from workers where worker='"+WORKERNAME+"'")
}
// id у всех одинаковые
const markRequest = (callback)=>{
    pgsql.query("UPDATE sublog set worker = '"+WORKERNAME+"' where product in (SELECT product from sublog where (worker is null or worker = '"+WORKERNAME+"') and rep is null order by id limit "+grabCount+" )",()=>{
        if(callback) callback();
    })
}
const getRequests = (callback)=>{
    pgsql.query("update sublog set snd = CURRENT_TIMESTAMP where snd is null or EXTRACT(EPOCH FROM current_timestamp-snd) > "+COOLDOWN,()=>{
        pgsql.query("select * from sublog where worker='"+WORKERNAME+"' and rep is null ",(err,res)=>{
            if(!res){
                console.log("No Requests");
                if(callback) callback(undefined);
            }
            
            if(callback) callback(res.rows);
        })
    });
    
}
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
    
    console.log(request);
    console.log('WorkRequest: '+Math.min(20-currentSkill.skillValue,1000)*1000+' msec...');
    console.log(currentSkill);
    setTimeout(()=>{
        console.log("Work Complete!");
        callback("success");
    },Math.min(20-currentSkill.skillValue,1000)*1000
    )   
}
const markComplete = (request,callback)=>{
    pgsql.query("update sublog set rep=CURRENT_TIMESTAMP where worker='"+WORKERNAME+"' and id = '"+request.id+"' and product='"+request.product+"'")
}

const loop = () =>{
    setInterval(()=>{
        markRequest(()=>{
            getRequests((requests)=>{
                if (requests){
                requests.forEach((request)=>{
                    // console.log(request);
                    workRequest(request,()=>{
                        pgsql.inventoryPut(request.product);
                        markComplete(request);
                    })
                })
            }
            })
        });
        updateWorker();
    },INTERVAL);
}

initWorker();
loop();
// process.on('exit',finishWorker());
