const {Pool} = require("pg");
const fs = require("fs");
const { v1: uuidv1 } = require("uuid");


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
    console.log('inventory put:\t'+product);
    query("insert into inventory(id,product) values('"+uuidv1()+"','"+product+"')");
}

const inventoryCheck = (product,callback) =>{
    query("select count (product) as cnt from inventory where product = '"+product+"'",(err,res)=>{
        console.log('Checking inventory for '+product+'\t\t - cnt: '+res.rows[0].cnt);
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
            query("delete from inventory where id in (select id from inventory where product = '"+product+"' order by id limit 1)",()=>{
                if (callback) callback(true);
            });   
        } else{
            console.log('Take '+product+' failed');
            if (callback) callback(false);
            }
    })
}
  



module.exports = {
    query,
    inventoryCheck,
    inventoryPut,
    inventoryTake
}