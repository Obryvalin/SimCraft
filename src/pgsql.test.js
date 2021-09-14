const pgsql = require("./pgsql");

describe('check tables',()=>{
    test('query log',(done)=>{
        pgsql.query("select * from log",(err,res)=>{
            expect(res).toBeDefined;
            expect(err).toBeUndefined;
            done();
        })
    })
    test('query sublog',(done)=>{
        pgsql.query("select * from sublog",(err,res)=>{
            expect(res).toBeDefined;
            expect(err).toBeUndefined;
            done();
        })
    })
    test('query inventory',(done)=>{
        pgsql.query("select * from inventory",(err,res)=>{
            expect(res).toBeDefined;
            expect(err).toBeUndefined;
            done();
        })
    })
})