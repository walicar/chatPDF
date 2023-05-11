import express from "express";
import http from "http";
import fs from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath, parse } from "url";
const app = express();
const server = http.createServer(app);
const upload = multer({ dest: "uploads/" });
// store me somewhere else, export me yknow, put me into an object
const statePath = "state.json";
if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
let state = {
  status: undefined,
  currentFile: undefined, // will always contain path of current file
  error: undefined,
  response: undefined,
  index: undefined,
  indices: ["none"],
  vectorStore: undefined,
  messages: [{
    color: "chat-color",
    name: "ChatPDF",
    content: "Welcome to chatPDF, select a document and ask me a question!",
  }],
};
fs.writeFileSync("state.json", JSON.stringify(state));
// idk
import {
  checkIndex,
  createEmbeddings,
  createIndex,
  deleteIndex,
  getIndices,
  getPineconeStore,
  getTexts,
  mockPromiseFail,
  mockPromisePass,
  queryDoc,
} from "./util.js";
// globals to be used by server only
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.post("/query", async (req, res) => {
  console.log(`Query to be sent: ${req.body.query}`);
  if (state.vectorStore && req.body.query) {
    const queryMessage = {
      color: "user-color",
      name: "User",
      content: req.body.query,
    };
    state.messages.push(queryMessage);
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
      //res.render("home", state);
      res.redirect("/home");
    } catch (e) {
      state.error = e;
      const errorMessage = {
        color: "chat-color",
        name: "ChatPDF",
        content: state.error,
      };
      state.messages.push(errorMessage);
      console.log(e);
      res.render("home", state);
    }
  } else {
    state.error = "Error sending query";
    res.redirect("/home");
  }
  saveState();
});

app.post("/getIndices", async (req, res) => {
  console.log("Attempting to get indices");
  const redirectURL = parse(req.get("Referer")).pathname;
  try {
    const res = await getIndices();
    state.indices = state.indices.concat(res);
    console.log(state.indices);
  } catch (e) {
    state.error = e;
    const errorMessage = {
      color: "chat-color",
      name: "ChatPDF",
      content: state.error,
    };
    state.messages.push(errorMessage);
    console.log(e);
  }
  saveState();
  res.redirect(redirectURL);
});

app.post("/setIndex", async (req, res) => {
  const redirectURL = parse(req.get("Referer")).pathname;
  if (req.body.index == "none") {
    state.index = req.body.index;
    state.vectorStore = undefined;
    console.log("state index is set to none");
    state.indices.splice(state.indices.indexOf(state.index), 1);
    state.indices.unshift(state.index);
  } else {
    try {
      state.index = req.body.index;
      state.vectorStore = await getPineconeStore(state.index);
      console.log(
        `state.index set to: ${req.body.index}, state.vectorStore is set`,
      );
      // then change how the indices are listed
      state.indices.splice(state.indices.indexOf(state.index), 1);
      state.indices.unshift(state.index);
      const desc = await checkIndex({ indexName: state.index });
      console.log(desc);
    } catch (e) {
      state.error = e;
      const errorMessage = {
        color: "chat-color",
        name: "ChatPDF",
        content: state.error,
      };
      state.messages.push(errorMessage);
      console.log(e);
    }
  }
  saveState();
  res.redirect(redirectURL);
});

app.post("/deleteStore", async (req, res) => {
  if (state.index == req.body.index) {
    state.index = undefined;
    state.vectorStore = undefined;
  }
  state.indices.splice(state.indices.indexOf(req.body.index), 1);
  console.log('deleted store');
  console.log(state);
  await deleteIndex(req.body.index);
  saveState()
  res.redirect("/upload");
});

app.post("/createStore", upload.single("doc"), async (req, res) => {
  const file = req.file;
  let textstore = "";
  // get texts
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
            textstore = await getTexts(`./uploads/${file.originalname}`);
            state.status = `PDF Loaded Successfully`;
            console.log(`File processed, text length: ${textstore.length}`);
          } catch (e) {
            console.log(e);
          }
        });
      });
    });
  } catch (e) {
    console.log(e);
    state.error = "Could not upload PDF";
  }
  // create the index with the name
  const docname = req.body.docname;
  console.log("trying to create index " + docname);
  try {
    await createIndex(docname);
    // await mockPromisePass();
  } catch (e) {
    state.error = e;
    console.log(e);
  }
  // create embeddings
  console.log("waiting for index to be initialized");
  await new Promise((resolve) => setTimeout(resolve, 75000));
  console.log("trying to create embeddings");
  try {
    let check = textstore.length ? true : false;
    console.log(check);
    state.vectorStore = await createEmbeddings(textstore, docname);
    // await mockPromisePass();
    console.log("Embeddings Fulfilled, vectorStore set.");
    state.status = "Created embeddings!";
  } catch (e) {
    state.error = e;
    console.log(e);
  }
  const errorMessage = {
    color: "chat-color",
    name: "ChatPDF",
    content: state.error,
  };
  state.messages.push(errorMessage);
  saveState();
  res.redirect("/upload");
});

app.get("/", (_req, res) => {
  res.redirect("/home");
});

app.get("/home", (_req, res) => {
  res.render("home", state);
});

app.get("/upload", (_req, res) => {
  res.render("upload", state);
});

server.listen(3000, () => {
  console.log("listening on http://localhost:3000/");
  console.log("visit the new page at http://localhost:3000/home");
  console.log("visit the upload page at http://localhost:3000/upload");
});

function saveState() {
  fs.writeFileSync("state.json", JSON.stringify(state));
}
