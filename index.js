import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import multer from 'multer';
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ dest: "uploads/" });
// store me somewhere else, export me yknow, put me into an object
let status = '';
let currentFile = ''; // will always contain path of current file
// idk
import { getTexts, createEmbeddings } from './util.js'
// globals to be used by server only
let texts = '';


app.set('view engine', 'ejs')
app.post('/pdfupload', upload.single("doc"), async (req, res) => {
  const file = req.file; 
  status = 'Error Occured'
  fs.readFile(file.path, async (err, data) => {
    if (err) throw err;
    fs.writeFile(`uploads/${file.originalname}`, data, async (err) => {
      if (err) throw err;
      console.log(`File uploaded: ${file.originalname}`);
      fs.unlink(file.path, async (err) => {
        if (err) throw err;
        currentFile = `./uploads/${file.originalname}`;
        try {  
          texts = await getTexts(`./uploads/${file.originalname}`)
          status = `PDF Loaded Successfully`;
          console.log(`File processed, text length: ${texts.length}`)
        } catch (e) {console.log(e)}
        res.redirect('/')
        //res.render('index', {status: status, currentFile: currentFile});
      });
    });
  });
});

app.post('/embeddingscreate', (req, res) => {
  // could use node.js path module to make this pretty
  console.log('trying to create embeddings')
  res.redirect('/')
  //res.render('index', {status: status, currentFile: currentFile});
})

app.get('/', (req, res) => {
  res.render('index', {status: status, currentFile: currentFile})
});

/*
io.on('connection', (socket) => {
  console.log('a user has connected');
})
*/
server.listen(3000, () => {
  console.log('listening on http://localhost:3000/');
});
