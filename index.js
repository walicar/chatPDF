import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import multer from 'multer';
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ dest: "uploads/" });
// store me somewhere else, export me yknow
let status = '';
let texts;
// idk
import { getTexts } from './util.js'

app.set('view engine', 'ejs')
app.post('/', upload.single("doc"), async (req, res) => {
  const file = req.file; 
  status = 'Error Occured'
  fs.readFile(file.path, async (err, data) => {
    if (err) throw err;
    fs.writeFile(`uploads/${file.originalname}`, data, async (err) => {
      if (err) throw err;
      //res.send('File uploaded sucessfully');
      console.log(`File uploaded: ${file.originalname}`);
      fs.unlink(file.path, async (err) => {
        if (err) throw err;
        status = `PDF Loaded: ${file.orignalname}`;
        try {  
          texts = await getTexts(`./uploads/${file.originalname}`)
        } catch (e) {console.log(e)}
        console.log(`File processed, text length: ${texts.length}`)
        res.render('index', {status: status});
      });
    });
  });
});

app.get('/', (req, res) => {
  texts = "";
  res.render('index', {status: status})
});

io.on('connection', (socket) => {
  console.log('a user has connected');
})

server.listen(3000, () => {
  console.log('listening on http://localhost:3000/');
});
