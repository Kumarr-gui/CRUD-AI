import express from 'express';
import path from 'path';
import db from './models/db.js';
import app from './app.js';
import multer from 'multer';
import mysql from 'mysql2';
import ejs from 'ejs';
import fs from 'fs';

import 'dotenv/config';

import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyDazZ_tVWqb2UJfDy-lBfSyYEAZp9x3EOY");
const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        return cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

app.set('view engine', "ejs");
app.set("views", path.resolve("./views"));

// middleware
app.use(express.urlencoded({ extended: false }));


//
app.get('/', (req, res) => {
    db.query('SELECT * FROM uploadedFile', (err, results) => {
        if (err) {
            console.error('Error while fetching the data from database', err);
            return;
        }
        return res.render('fileupload', { file: results });
    });
});

//upload
app.post('/upload', upload.single('docFile'), (req, res) => {
    const filename = req.file.filename;
    db.query('INSERT INTO uploadedFile (filename) VALUES (?)', [filename], (err, result) => {
        if (err) {
            console.error('Error in uploading', err);
            return res.status(500).send('Something went wrong');
        }
        console.log('File uploaded in database successfully');
        return res.redirect('/');
    });
});

//update the file name
app.get('/update/:id', (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM uploadedFile WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error('Error while fetching the file for update:', err);
            return res.status(500).send('Something went wrong!');
        }
        if (result.length === 0) {
            return res.status(404).send('File not found!');
        }
        return res.render('updateFile', { file: result[0] });
    });
});

app.post('/update/:id', (req, res) => {
    const id = req.params.id;
    const newFileName = req.body.filename;
    db.query('UPDATE uploadedFile SET filename = ? WHERE id = ?', [newFileName, id], (err, result) => {
        if (err) {
            console.error('Error while updating file:', err);
            return res.status(500).send('Something went wrong');
        }
        return res.redirect('/');
    });
});

//delete
app.get("/delete/:id",(req, res)=>{
    const id = req.params.id;
    db.query('DELETE FROM uploadedFile WHERE id = ?',[id], (err, result) => {
        if(err){
            console.error('Error while deleting the file',err);
            return res.status(500).send('Someything went wrong');
        }
        return res.redirect('/');
    });
});

app.get('/summary/:id', async (req,res) =>{
    const id = req.params.id;
    //database query
    db.query('SELECT * FROM uploadedFile WHERE id = ?',[id],async (err, result) =>{
        if(err){
            console.error('Error',err);
            return res.status(400).send('Something went wrong');
        }
        if( result.length === 0){
            return res.status(404).send('File not found');
        }
        const file = result[0];
        const filePath = path.resolve('./uploads',file.filename);
        try{
            const fileContent = fs.readFileSync(filePath,'utf-8');

            // condition for if the the file is empty
            if(!fileContent){
                return res.status(404).send('File is empty');
            }
            const prompt = `Analyze the given text and give summarize within 50 words  and key insights in 10 points of  the following:\n ${fileContent}`;
            const geminiResponse = await model.generateContent([prompt]);

            console.log('Gemini AI Response:',JSON.stringify(geminiResponse,null,2));
        }catch(error){
            console.error('Error while generating summary',error);
            return res.status(500).send('Error while generating summary')
        }

    })
})

//server listening
app.listen(process.env.PORT, () => {
    console.log(`server started at PORT ${process.env.PORT}`);
});
