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
  if (state.service.helper.store && req.body.query) {
    const content = req.body.query;
    const queryMessage = util.makeMessage("user-color", "User", content);
    state.messages.push(queryMessage);
    try {
      const response = await state.service.helper.queryDocument(req.body.query);
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
    const res = await state.service.helper.getDocuments();
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
    state.service.helper.store = undefined;
    updateList(state.documents, state.document);
  } else {
    try {
      state.document = req.body.document;
      await state.service.helper.useDocument(state.document);
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
    state.service.helper.store = undefined;
  }
  state.documents.splice(state.indices.indexOf(req.body.document), 1);
  await state.service.helper.deleteDocument(req.body.document);
  res.redirect("/docs");
});

app.post("/createStore", upload.single("doc"), async (req, res) => {
  const file = req.file;
  try {
    const text = await util.getTexts(file);
    const docname = req.body.docname;
    await state.service.helper.createDocument(text, docname);
  } catch (e) {
    pushError(e);
    console.log(e);
  }
  res.redirect("/docs");
});

app.post("/selectService", (req, res) => {
  state.service.name = req.body.servicename;
  updateList(state.service.names, state.service.name);
  saveService();
  state.service.helper = getService(state.service.name);
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
    updateList(state.service.names, state.service.name);
  } else {
    state.service.name = "pinecone";
    state.service.helper = getService("pinecone");
    saveService();
  }
}

function updateList(list, item) {
  list.splice(list.indexOf(item), 1);
  list.unshift(item);
}
