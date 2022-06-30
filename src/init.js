const pgsql = require("./pgsql");


const dbInit = () =>{
    console.log("Database reset...");
    pgsql.query("DROP TABLE log",(err,res)=>{
        
            pgsql.query("CREATE TABLE log (source character varying(10),id character varying(36),worker character varying(36),snd timestamp without time zone,rep timestamp without time zone,result character varying(5))");
            console.log("log done!");
        
    })
    pgsql.query("DROP TABLE reqdata",(err,res)=>{
        
            pgsql.query("CREATE TABLE reqdata (source character varying(10),id character varying(36),product character varying(20))");
            console.log("reqdata done!");
        
    })

    pgsql.query("DROP TABLE inventory",(err,res)=>{
        
        pgsql.query("CREATE TABLE inventory (id character varying(36),product character varying(20))");
        console.log("inventory done!");
    
})

pgsql.query("DROP TABLE workers",(err,res)=>{
        
    pgsql.query("CREATE TABLE workers (worker character varying(36),update timestamp without time zone)");
    console.log("workers done!");

})

    pgsql.query("DROP TABLE orders",(err,res)=>{
            pgsql.query("CREATE TABLE orders (orderId character varying(36),product character varying(20),worker character varying(36),snd timestamp without time zone,rep timestamp without time zone,result character varying(5))");
            console.log("orders done!");
        
    })
}
dbInit();
