import express from "express";
import fs from "fs/promises";
import fsSync, { existsSync } from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath, parse } from "url";
import { util } from "./lib/util.js";
import { PineconeHelper } from "./lib/pineconeHelper.js";
import { ChromaHelper } from "./lib/chromaHelper.js";

const app = express();
const upload = multer({ dest: "./uploads/" });
const statePath = "state.json";
if (fsSync.existsSync(statePath)) fsSync.unlinkSync(statePath);
let state = {
  service: {
    name: 'pinecone', // do not overwrite this, must be saved
    helper: undefined, // must be omitted when state is written to file
  },
  error: undefined,
  response: undefined,
  index: undefined,
  indices: ["none"],
  vectorStore: undefined,
  messages: [
    {
      color: "chat-color",
      name: "ChatPDF",
      content: "Welcome to chatPDF, select a document and ask me a question!",
    },
  ],
};
loadService();
fsSync.writeFileSync("state.json", JSON.stringify(state));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.post("/query", async (req, res) => {
  if (state.vectorStore && req.body.query) {
    const content = req.body.query;
    const queryMessage = util.makeMessage("user-color", "User", content);
    state.messages.push(queryMessage);
    try {
      const response = await util.queryDoc(req.body.query, state.vectorStore);
      state.response = response;
      const answerMessage = util.makeMessage("chat-color", "ChatPDF", response);
      state.messages.push(answerMessage);
      console.log("Query Fulfilled");
    } catch (e) {
      pushError(e);
      console.log(e);
    }
  } else {
    pushError("Error sending query");
  }
  saveState();
  res.redirect("/home");
});

app.post("/getIndices", async (req, res) => {
  const redirectURL = parse(req.get("Referer")).pathname;
  try {
    const res = await util.getIndices();
    state.indices = state.indices.concat(res);
  } catch (e) {
    pushError(e);
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
    state.indices.splice(state.indices.indexOf(state.index), 1);
    state.indices.unshift(state.index);
  } else {
    try {
      state.index = req.body.index;
      state.vectorStore = await util.getStore(state.index);
      // then change how the indices are listed
      state.indices.splice(state.indices.indexOf(state.index), 1);
      state.indices.unshift(state.index);
    } catch (e) {
      pushError(e);
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
  await util.deleteIndex(req.body.index);
  saveState();
  res.redirect("/docs");
});

app.post("/createStore", upload.single("doc"), async (req, res) => {
  const file = req.file;
  // get texts
  try {
    const text = await getTexts(file)
    const helper = new PineconeHelper();
    const docname = req.body.docname;
    const store = await helper.createDocument(text, docname);
    state.vectorStore = store;
  } catch (e) {
    pushError(e);
    console.log(e);
  }
  saveState();
  res.redirect("/docs")
})

app.post("/selectService", (req, res) => {
  if (req.body.service != state.service) {
    state.service = req.body.service;
    saveService();
    state.helper = getService(req.body.service);
  }
  res.redirect("/home");
})

app.get("/", (_req, res) => {
  res.redirect("/home");
});

app.get("/home", (_req, res) => {
  res.render("home", state);
});

app.get("/docs", (_req, res) => {
  state.error = undefined;
  saveState();
  res.render("docs", state);
});

app.listen(3000, () => {
  console.log("Visit chatPDF on http://localhost:3000/");
});

function saveState() {
  fsSync.writeFileSync("state.json", JSON.stringify(state));
}

function pushError(e, string = undefined) {
  state.error = e;
  const errorMessage = util.makeMessage("chat-color", "ChatPDF", state.error);
  state.messages.push(errorMessage);
}

async function getTexts(file) {
  try {
    const data = await fs.readFile(file.path);
    await fs.writeFile(`uploads/${file.originalname}`, data);
    console.log(`File uploaded: ${file.originalname}`);
    await fs.unlink(file.path);
    return await util.getTexts(`./uploads/${file.originalname}`);
  } catch (err) {
    pushError("Could not upload PDF");
    console.log(err);
  }
}

const services = {
  pinecone: () => new PineconeHelper(),
  chroma: () => new ChromaHelper()
}

function getService(name) {
  const factory = services[name];
  if (factory) {
    return factory();
  } else {
    return null;
  }
}

function saveService() {
  fsSync.writeFileSync("servicename", state.service.name);
}

function loadService() {
  if (fsSync.existsSync("servicename")) {
    state.service.name = fsSync.readFileSync("servicename");
  } else {
    saveService();
  }
}