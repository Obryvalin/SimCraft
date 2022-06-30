const pgsql = require("./pgsql");
const fs = require("fs");
const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());

const { v1: uuidv1 } = require("uuid");

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
         
   
    
    
    
};

const placeOrder = (product) =>{
    
    pgsql.query("select count(product) as cnt from orders where product='"+product+"' and rep is null",(err,res)=>{
        if (res.rows[0].cnt==0){
            console.log("Place Order: "+product);
            pgsql.query("insert into orders(orderid,product) values('"+uuidv1()+"','"+product+"')");
        }
    })
    
}

// const deRecipe = (recipe) =>{
//     let returnArray = [];
    
//     let hasRecipe = false;
//     recipes.forEach((recipeItem)=>{
//         if (recipeItem.recipeName == recipe){
//         hasRecipe = true;
//         if (recipeItem.components){
//             recipeItem.components.forEach((component)=>{
//                 returnArray = returnArray.concat(deRecipe(component));
//             })
//         }
//     }
//     })

//     console.log ("deRecipe + ",recipe);
//     if (hasRecipe) returnArray.push(recipe);
//     return returnArray;

// }


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
    pgsql.query("select * from orders where id='"+id+"' and rep is null",(err,res)=>{
        if (res.rows.length > 0){
            console.log(id+ " - not finished");
            if(callback) callback({result:"Unfinished"});
        }
        if(res.rows.length == 0){
            if(callback) callback({result:"success"});


        }
    });
}

const finishRequest = (callback)=>{
    pgsql.query("select log.*,reqdata.product from log inner join reqdata on log.id=reqdata.id where rep is null",(err,res)=>{
        if (res){
            res.rows.forEach((row)=>{
                inventoryTake(row.product,(result)=>{
                    if (result){
                        pgsql.query("UPDATE log set rep = CURRENT_TIMESTAMP where id = '"+row.id+"'",(err,res)=>{
                            callback("success");
                            console.log(row.id+ " for "+row.product+" is done!")
                        })
                    }
                    else{
                        placeOrder(row.product);
                    }
                })
            })
        }
    })
    
}


const inventoryPut = (product) =>{
    console.log('inventory put:\t'+product);
    pgsql.query("insert into inventory(id,product) values('"+uuidv1()+"','"+product+"')");
}

const inventoryCheck = (product,callback) =>{
    pgsql.query("select count (product) as cnt from inventory where product = '"+product+"'",(err,res)=>{
        console.log('Inventory has '+product+'\t\t: '+res.rows[0].cnt);
        if (res.rows[0].cnt==0) {
            if (callback) callback(false);
        }
        else{       
            if (callback) callback(true);
        }
    }) 
}

const inventoryTake = (product,callback) =>{
    inventoryCheck(product,(checkResult)=>{
        if(checkResult)
        {
            console.log('inventory take:\t'+product);       
            pgsql.query("select id from inventory where product = '"+product+"' order by id limit 1",(err,resids)=>{
                    
                if(resids.rows){
                    pgsql.query("delete from inventory where id='"+resids.rows[0].id+"'",(err,res)=>{
                        
                        if (!res||res.rowCount==0) callback(false);
                        if (res && res.rowCount>0) callback(true);
                    })
                }
            });   
        } else{
            console.log('Take '+product+' failed');
            if (callback) callback(false);
            }
    })
}
  
const killOldWorkers = (callback) =>{
    pgsql.query("DELETE from workers where extract(epoch from CURRENT_TIMESTAMP-update) > "+maxWorkerTTL,(err,res)=>{
        if (!err){  
            pgsql.query("UPDATE orders set worker = null,snd = null where worker not in (select worker from workers) and rep is null",(err,res)=>{
                callback("success");
            })
        }
    })
}
const getLog = (callback) =>{
    pgsql.query("select log.*,reqdata.product from log inner join reqdata on log.id=reqdata.id where rep is null order by snd limit 10",(err,res)=>{
        callback(res.rows);
    });
}
const getWorkers = (callback) =>{
    pgsql.query("select * from workers",(err,res)=>{
        callback (res.rows);
    });
}
const getRecipes = () =>{
    return recipes;
}

module.exports = {
    newRequest,
    getResult,
    finishRequest,
    placeOrder,
    inventoryCheck,
    inventoryPut,
    inventoryTake,
    killOldWorkers,
    getLog,
    getWorkers,
    getRecipes
} 