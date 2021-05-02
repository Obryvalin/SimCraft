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


const dbInit = () =>{
    console.log("Database reset...");
    query("DROP TABLE log",(err,res)=>{
        
            query("CREATE TABLE log (source character varying(10),id character varying(36),worker character varying(10),snd timestamp without time zone,rep timestamp without time zone,result character varying(5))");
            console.log("log done!");
        
    })
    query("DROP TABLE reqdata",(err,res)=>{
        
            query("CREATE TABLE reqdata (source character varying(10),id character varying(36),product character varying(20))");
            console.log("reqdata done!");
        
    })

    query("DROP TABLE inventory",(err,res)=>{
        
        query("CREATE TABLE inventory (product character varying(20))");
        console.log("inventory done!");
    
})



    query("DROP TABLE subrequests",(err,res)=>{
        
            query("CREATE TABLE subrequests (source character varying(10),id character varying(36),product character varying(20))");
            console.log("subrequests done!");
        
    })
    query("DROP TABLE sublog",(err,res)=>{
            query("CREATE TABLE sublog (source character varying(10),id character varying(36),product character varying(20),worker character varying(10),snd timestamp without time zone,rep timestamp without time zone,result character varying(5))");
            console.log("sublog done!");
        
    })
}
dbInit();
