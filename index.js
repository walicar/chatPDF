import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import multer from 'multer';
import bodyParser from 'body-parser';
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const upload = multer({ dest: "uploads/" });
// store me somewhere else, export me yknow, put me into an object
let state = {
  status: '',
  currentFile: '', // will always contain path of current file
  error: '',
  response: '',
  index: '',
  indices: []
}
// idk
import { getTexts, createEmbeddings, getIndices, mockPromisePass, mockPromiseFail} from './util.js'
// globals to be used by server only
let texts = '';

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true}));

app.post('/pdfupload', upload.single("doc"), async (req, res) => {
  const file = req.file; 
  try {
    fs.readFile(file.path, async (err, data) => {
    if (err) throw err;
    fs.writeFile(`uploads/${file.originalname}`, data, async (err) => {
      if (err) throw err;
      console.log(`File uploaded: ${file.originalname}`);
      fs.unlink(file.path, async (err) => {
        if (err) throw err;
        state.currentFile = `./uploads/${file.originalname}`;
        try {  
          texts = await getTexts(`./uploads/${file.originalname}`)
          state.status = `PDF Loaded Successfully`;
          console.log(`File processed, text length: ${texts.length}`)
        } catch (e) {console.log(e)}
        res.redirect('/')
      });
    });
  });
  } catch (e) {
    console.log(e)
    state.error = 'Could not upload PDF'
  }
});

app.post('/embeddingscreate', async (req, res) => {
  // could use node.js path module to make this pretty
  if (texts && state.index) {
    console.log('trying to create embeddings')
    try {
      // createEmbeddings(texts, 'cpdf1'); // TODO: hardcoded index name
      await mockPromisePass();
      console.log('Embeddings Fulfilled');
      state.status = 'Created embeddings!';
      state.index = 'cpdf1'; // TODO: hardcoded index name
    } catch (e) {
      state.error = e;
      console.log(e);
    }
  } else { state.error = 'no texts or no selected index.'; }
  res.redirect('/')
})

app.post('/query', async (req, res) => {
  console.log(`Query to be sent: ${req.body.query}`);
  if (state.index && req.body.query) {
    try {
      state.response = await mockPromisePass();
      console.log('Query Fulfilled');
    } catch (e) {
      state.error = e;
      console.log(e);
    }
  } else { state.error = 'Error sending query'; }
  res.redirect('/');
})

app.post('/getIndices', async (req, res) => {
  console.log('Attempting to get indices')
  try {
    state.indices = await getIndices();
    console.log(state.indices);
  } catch (e) { 
    console.log(e) 
    state.error = e;
  }
  res.redirect('/');
})

app.post('/setIndex', (req, res) => {
  state.index = req.body.index;
  console.log(`Just set state.index to: ${req.body.index}`)
  res.redirect('/');
})

app.get('/', (req, res) => {
  res.render('index', state)
});

/*
io.on('connection', (socket) => {
  console.log('a user has connected');
})
*/
server.listen(3000, () => {
  console.log('listening on http://localhost:3000/');
});
