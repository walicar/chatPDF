import express from "express";
import fs from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath, parse } from "url";
import { util } from "./lib/util.js";
import { PineconeHelper } from "./lib/pineconeHelper.js";
import { ChromaHelper } from "./lib/chromaHelper.js";

const services = {
  pinecone: () => new PineconeHelper(),
  chroma: () => new ChromaHelper(),
};

const app = express();
const upload = multer({ dest: "./uploads/" });
let state = {
  service: {
    name: "pinecone",
    names: ["pinecone", "chroma"],
    helper: undefined,
  },
  error: undefined,
  document: undefined,
  documents: ["none"],
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
  res.redirect("/home");
});

app.post("/getIndices", async (req, res) => {
  const redirectURL = parse(req.get("Referer")).pathname;
  try {
    const res = await util.getIndices();
    state.documents = state.documents.concat(res);
  } catch (e) {
    pushError(e);
    console.log(e);
  }
  res.redirect(redirectURL);
});

app.post("/setDocument", async (req, res) => {
  const redirectURL = parse(req.get("Referer")).pathname;
  if (req.body.document == "none") {
    state.document = req.body.document;
    state.vectorStore = undefined;
    updateList(state.documents, state.document);
  } else {
    try {
      state.document = req.body.document;
      state.vectorStore = await util.getStore(state.document);
      updateList(state.documents, state.document);
    } catch (e) {
      pushError(e);
      console.log(e);
    }
  }
  res.redirect(redirectURL);
});

app.post("/deleteStore", async (req, res) => {
  if (state.document == req.body.document) {
    state.document = undefined;
    state.vectorStore = undefined;
  }
  state.documents.splice(state.indices.indexOf(req.body.document), 1);
  await util.deleteIndex(req.body.document);
  res.redirect("/docs");
});

app.post("/createStore", upload.single("doc"), async (req, res) => {
  const file = req.file;
  // get texts
  try {
    const text = await util.getTexts(file);
    const helper = new PineconeHelper();
    const docname = req.body.docname;
    const store = await helper.createDocument(text, docname);
    state.vectorStore = store;
  } catch (e) {
    pushError(e);
    console.log(e);
  }
  res.redirect("/docs");
});

app.post("/selectService", (req, res) => {
  console.log(req.body.servicename + " instate: " + state.service.name);
  state.service.name = req.body.servicename;
  updateList(state.service.names, state.service.name);
  saveService();
  state.helper = getService(req.body.service);
  state.documents = ["none"];
  state.messages = [
    {
      color: "chat-color",
      name: "ChatPDF",
      content: "Welcome to chatPDF, select a document and ask me a question!",
    },
  ];
  res.redirect("/home");
});

app.get("/", (_req, res) => {
  res.redirect("/home");
});

app.get("/home", (_req, res) => {
  res.render("home", state);
});

app.get("/docs", (_req, res) => {
  state.error = undefined;
  res.render("docs", state);
});

app.listen(3000, () => {
  console.log("Visit chatPDF on http://localhost:3000/");
});

function pushError(e, string = undefined) {
  state.error = e;
  const errorMessage = util.makeMessage("chat-color", "ChatPDF", state.error);
  state.messages.push(errorMessage);
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
  fs.writeFileSync("servicename", state.service.name);
}

function loadService() {
  if (fs.existsSync("servicename")) {
    state.service.name = fs.readFileSync("servicename", "utf-8");
    state.service.helper = getService(state.service.name);
  } else {
    saveService();
  }
}

function updateList(list, item) {
  list.splice(list.indexOf(item), 1);
  list.unshift(item);
}
