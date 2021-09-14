const pgsql = require("./pgsql");
const fs = require("fs");
const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());

const maxWorkerTTL = 300;

const subRequest = (source,id,product,callback) =>{
    

    if (!source || !id || !product) {
        if (callback)  callback('Not enogh parameters',undefined);
    }
    let recipe;
    let hasRecipe = false;
    recipes.forEach((arecipe)=>{
        if (arecipe.recipeName == product){
        hasRecipe = true;
        recipe = arecipe.recipeName;
        }
    })
     if (hasRecipe == false){
        if (callback) callback('No suitable recipe',undefined);
     }
     let components = [];
     components =  deRecipe(recipe);
     console.log(components);
     components.forEach((component)=>{
         pgsql.query("insert into sublog(source,id,product) values('"+source+"','"+id+"','"+component+"')");
     })
    
    
};

const deRecipe = (recipe) =>{
    let returnArray = [];
    
    let hasRecipe = false;
    recipes.forEach((recipeItem)=>{
        if (recipeItem.recipeName == recipe){
        hasRecipe = true;
        if (recipeItem.components){
            recipeItem.components.forEach((component)=>{
                returnArray = returnArray.concat(deRecipe(component));
            })
        }
    }
    })

    console.log ("deRecipe + ",recipe);
    if (hasRecipe) returnArray.push(recipe);
    return returnArray;

}


const newRequest = (source,id,product,callback) =>{
    if (!source || !id || !product) {
        if (callback) callback('Not enogh parameters',undefined);
    }
    else{
        pgsql.query("INSERT INTO reqdata(source,id,product) values ('"+source+"','"+id+"','"+product+"')",()=>{
            pgsql.query("INSERT INTO log(source,id,snd) values ('"+source+"','"+id+"',CURRENT_TIMESTAMP)",()=>{
                subRequest(source,id,product);
                if (callback) callback(undefined,undefined);
            });      
        });
        
    }
}

const getResult = (id,callback) =>{
    let unfinished;
    pgsql.query("select * from sublog where id='"+id+"' and rep is null",(err,res)=>{
        if (res){
            console.log(id+ " - not finished");
            if(callback) callback({result:"Unfinished"});
        }
        if(!res){
            if(callback) callback({result:"success"});


        }
    });
}

const finishRequest = (callback)=>{
    pgsql.query("UPDATE log set rep = CURRENT_TIMESTAMP where id not in (select id from sublog where rep is null)",(err,res)=>{
        callback("success");
    })
}
const killOldWorkers = (callback) =>{
    pgsql.query("DELETE from workers where extract(epoch from CURRENT_TIMESTAMP-update) > "+maxWorkerTTL,(err,res)=>{
        if (!err){  
            pgsql.query("UPDATE sublog set worker = '' where worker not in (select worker from workers)",(err,res)=>{
                callback("success");
            })
        }
    })
}
const getLog = (callback) =>{
    pgsql.query("select * from log where rep is null order by snd limit 10",(err,res)=>{
        callback(res.rows);
    });
}
const getWorkers = (callback) =>{
    pgsql.query("select * from workers",(err,res)=>{
        callback (res.rows);
    });
}

module.exports = {
    newRequest,
    getResult,
    finishRequest,
    killOldWorkers,
    getLog,
    getWorkers
} 