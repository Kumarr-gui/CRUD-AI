    const mysql = require('mysql');
    const dotenv = require('dotenv');
    require('dotenv').config()

    // database connection

    const db = mysql.createConnection({
        host : process.env.HOST,
        password : process.env.PASSWORD,
        user : process.env.USER,
        database : process.env.DATABASE
    })
    db.connect((err) =>{
        if(err){
            console.error('Error while connecting with database')
        }
        else{
            console.log('Database connection established successfully')
        }
    })

    module.exports = db;