const {Pool} = require("pg");
const fs = require("fs");

const pgoptions = JSON.parse(fs.readFileSync("conf/pg.json").toString());

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

const inventoryPut = (product) =>{
    query("insert into inventory(product) values('"+product+"')");
}

const inventoryTake = (product) =>{
    query("delete from inventory where product = '"+product+"' limit 1")
}


module.exports = {
    query,
    inventoryPut,
    inventoryTake
}