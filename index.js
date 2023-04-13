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
  indices: [],
  vectorStore: ''
}
// idk
import { getTexts, createEmbeddings, queryDoc, getIndices, getPineconeStore, mockPromiseFail, checkIndex, mockPromisePass} from './util.js'
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

app.post('/makeEmbeddings', async (req, res) => {
  if (texts && state.index) {
    console.log('trying to create embeddings')
    try {
      // DUMMY CODE
      state.vectorStore = await createEmbeddings(texts, state.index);
      // await mockPromisePass();
      console.log('Embeddings Fulfilled, vectorStore set.');
      state.status = 'Created embeddings!';
    } catch (e) {
      state.error = e;
      console.log(e);
    }
  } else { state.error = 'no texts or no selected index.'; }
  res.redirect('/')
})

app.post('/query', async (req, res) => {
  console.log(`Query to be sent: ${req.body.query}`);
  if (state.vectorStore && req.body.query) {
    try {
      // DUMMY CODE
      state.response = await queryDoc(req.body.query, state.vectorStore)
      // state.response = await mockPromisePass();
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

app.post('/setIndex', async (req, res) => {
  state.index = req.body.index;
  console.log(typeof state.vectorStore)
  state.vectorStore = await getPineconeStore(state.index);
  console.log(typeof state.vectorStore)
  console.log(state.vectorStore);
  console.log(`state.index set to: ${req.body.index}, state.vectorStore is set`)
  const desc = await checkIndex({ indexName: state.index });
  console.log(desc);
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
