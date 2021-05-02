const {Pool} = require("pg");
const fs = require("fs");

const pgoptions = JSON.parse(fs.readFileSync("conf/pg.json").toString());
const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());

pool = new Pool(pgoptions);

const query = (sql,callback)=>{
    pool.query(sql,(err,res)=>{
        if (err){
            console.log("PG error: "+ sql);
            console.log(err);
            if (callback){callback(err,undefined)}

        }
        if (!err)
        {
            if(callback){callback(undefined,res)}

        }
    });

};

const subRequest = (source,id,product,callback) =>{
    

    if (!source || !id || !product) {
        callback('Not enogh parameters',undefined);
    }
    let recipe;
    let hasRecipe = false;
    recipes.forEach((arecipe)=>{
        if (arecipe.recipeName == product)
        hasRecipe = true;
        recipe = arecipe;
    })
     if (hasRecipe == false){
        callback('No suitable recipe',undefined);
     }
     let components = [];
     components =  deRecipe(recipe);

     components.forEach((component)=>{
         query("insert into sublog(source,id,product,snd) values('"+source+"','"+id+"','"+component+"',CURRENT_TIMESTAMP)");
     })
    
    
};

const deRecipe = (recipe) =>{
    let returnArray = [];
    if (recipe.components){
        recipe.components.forEach((component)=>{
            returnArray.concat(deRecipe(component));
        })
    }
    returnArray.push(recipe.recipeName);
    return returnArray;

    }


const newRequest = (source,id,product,callback) =>{
    if (!source || !id || !product) {
        callback('Not enogh parameters',undefined);
    }
    else{
        query("INSERT INTO reqdata(source,id,product) values ('"+source+"',"+id+"','"+procuct+"')",()=>{
            query("INSERT INTO log(source,id,snd) values ('"+source+"','"+id+"',CURRENT_TIMESTAMP)",()=>{
            callback(undefined,undefined);
            });      
        });
        
    }
}


const inventoryPut = (product) =>{
    query("insert into inventory(product) values('"+product+"')");
}

const inventoryTake = (product) =>{
    query("delete from inventory where product = '"+product+"' limit 1")
}

const canFinishRequest = (source,id) =>{

}

module.exports = {
    dbInit,
    newRequest
} 