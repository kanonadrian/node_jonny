const sql = require('mssql');
const { database } = require('./keys');
const { promisify } = require('util');

const pool = new sql.ConnectionPool(database);
 
pool.connect().then(function(){
  console.log("DB connected");
 }).catch(function(error){
    console.error('DB Message =>', error);
    pool.close();
});
//promesas query
pool.query = promisify(pool.query);

module.exports = pool;