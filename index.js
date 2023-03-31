const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: "uploads/" });
// store me somewhere else, export me yknow
let status = '';

app.set('view engine', 'ejs')
app.post('/', upload.single("doc"), (req, res) => {
  const file = req.file; 
  status = 'Error Occured'
  fs.readFile(file.path, (err, data) => {
    if (err) throw err;
    fs.writeFile(`uploads/${file.originalname}`, data, (err) => {
      if (err) throw err;
      //res.send('File uploaded sucessfully');
      console.log(`File uploaded: ${file.originalname}`);
      status = 'File uploaded sucessfully';
      fs.unlink(file.path, (err) => {
        if (err) throw err;
      });
    });
  });
  res.render('index', {status: status});
});

app.get('/', (req, res) => {
  res.render('index', {status: status})
});

io.on('connection', (socket) => {
  console.log('a user has connected');
})

server.listen(3000, () => {
  console.log('listening on http://localhost:3000/');
});
