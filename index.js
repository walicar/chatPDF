import express from "express";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath, parse } from "url";
const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const upload = multer({ dest: "uploads/" });
// store me somewhere else, export me yknow, put me into an object
let state = {
  status: "",
  currentFile: "", // will always contain path of current file
  error: "",
  response: "",
  index: "",
  indices: [],
  vectorStore: "",
  messages: [{
    color: "chat-color",
    name: "ChatPDF",
    content: "Welcome to chatPDF, select a document and ask me a question!",
  }],
};
// idk
import {
  checkIndex,
  createEmbeddings,
  getIndices,
  getPineconeStore,
  getTexts,
  mockPromiseFail,
  mockPromisePass,
  queryDoc,
} from "./util.js";
import { argv0 } from "process";
// globals to be used by server only
let texts = "";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/pdfupload", upload.single("doc"), async (req, res) => {
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
            texts = await getTexts(`./uploads/${file.originalname}`);
            state.status = `PDF Loaded Successfully`;
            console.log(`File processed, text length: ${texts.length}`);
          } catch (e) {
            console.log(e);
          }
          res.redirect("/upload");
        });
      });
    });
  } catch (e) {
    console.log(e);
    state.error = "Could not upload PDF";
  }
});

app.post("/makeEmbeddings", async (_req, res) => {
  if (texts && state.index) {
    console.log("trying to create embeddings");
    try {
      // DUMMY CODE
      state.vectorStore = await createEmbeddings(texts, state.index);
      // await mockPromisePass();
      console.log("Embeddings Fulfilled, vectorStore set.");
      state.status = "Created embeddings!";
    } catch (e) {
      state.error = e;
      console.log(e);
    }
  } else state.error = "no texts or no selected index.";
  res.redirect("/upload");
});

app.post("/query", async (req, res) => {
  console.log(`Query to be sent: ${req.body.query}`);
  const queryMessage = {
    color: "user-color",
    name: "User",
    content: req.body.query,
  };
  state.messages.push(queryMessage);
  res.render("/home", state);
  if (state.vectorStore && req.body.query) {
    try {
      // DUMMY CODE
      const response = await queryDoc(req.body.query, state.vectorStore);
      state.response = response;
      // state.response = await mockPromisePass();
      const answerMessage = {
        color: "chat-color",
        name: "ChatPDF",
        content: response,
      };
      state.messages.push(answerMessage);
      console.log("Query Fulfilled");
    } catch (e) {
      state.error = e;
      console.log(e);
    }
  } else state.error = "Error sending query";
  res.redirect("/home");
});

app.post("/getIndices", async (req, res) => {
  console.log("Attempting to get indices");
  const redirectURL = parse(req.get("Referer")).pathname;
  try {
    state.indices = await getIndices();
    console.log(state.indices);
  } catch (e) {
    console.log(e);
    state.error = e;
  }
  res.redirect(redirectURL);
});

app.post("/setIndex", async (req, res) => {
  const redirectURL = parse(req.get("Referer")).pathname;
  state.index = req.body.index;
  state.vectorStore = await getPineconeStore(state.index);
  console.log(
    `state.index set to: ${req.body.index}, state.vectorStore is set`,
  );
  const desc = await checkIndex({ indexName: state.index });
  console.log(desc);
  res.redirect(redirectURL);
});

app.get("/", (_req, res) => {
  res.render("index", state);
});

app.get("/home", async (_req, res) => {
  const deleteMeLater = {
    color: "user-color",
    name: "User",
    content: "Hey this is a test message, please delete me later",
  };
  state.messages.push(deleteMeLater);
  res.render("home", state);
});

app.get("/upload", (_req, res) => {
  res.render("upload", state);
});

/*
io.on('connection', (socket) => {
  console.log('a user has connected');
})
*/

server.listen(3000, () => {
  console.log("listening on http://localhost:3000/");
  console.log("visit the new page at http://localhost:3000/home");
  console.log("visit the upload page at http://localhost:3000/upload");
});
