const pgsql = require("./pgsql");
const fs = require("fs");
const {recipes} = JSON.parse(fs.readFileSync("conf/recipes.json").toString());


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
    returnArray.push(recipe);
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

module.exports = {
    newRequest,
    getResult
} 