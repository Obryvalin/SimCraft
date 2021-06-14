const {Pool} = require("pg");
const fs = require("fs");

const pgoptions = JSON.parse(fs.readFileSync("conf/pg.json").toString());

pool = new Pool(pgoptions);

const query = (sql,callback)=>{
//    console.log ("QUERY: "+sql);
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

const inventoryPut = (product) =>{
    query("insert into inventory(product) values('"+product+"')");
}

const inventoryCheck = (product) =>{
    query("select count (product) as cnt where product = "+product,(err,res)=>{
        if (res.cnt==0) {
            return false;
        }
        else{       
            return true;
        }
        
    }) 
}

const inventoryTake = (product) =>{
         
    query("delete from inventory where product = '"+product+"' limit 1",()=>{
        return true;
    });
}
  



module.exports = {
    query,
    inventoryCheck,
    inventoryPut,
    inventoryTake
}