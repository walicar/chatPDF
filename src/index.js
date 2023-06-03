import express from "express";
import fs from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath, parse } from "url";
import { util } from "./lib/util.js";
import { PineconeHelper } from "./lib/pineconeHelper.js";
import { ChromaHelper } from "./lib/chromaHelper.js";
import { URL } from 'url';

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
  error: undefined, // used for routes that are not "/home"
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
      pushError(e.message);
    }
  } else {
    pushError("No document selected, or empty query");
  }
  res.redirect("/home");
});

app.post("/getDocuments", async (req, res) => {
  const redirectURL = new URL(req.get("Referer")).pathname;
  try {
    const res = await state.service.helper.getDocuments();
    state.documents = util.merge(state.documents, res);
  } catch (e) {
    if (redirectURL == "/home") {
      pushError(e.message);
    } else {
      state.error = e.message;
    }
  }
  res.redirect(redirectURL);
});

app.post("/setDocument", async (req, res) => {
  const redirectURL = new URL(req.get("Referer")).pathname;
  if (req.body.document == "none") {
    state.document = req.body.document;
    state.service.helper.store = undefined;
    util.updateList(state.documents, state.document);
  } else {
    try {
      state.document = req.body.document;
      await state.service.helper.useDocument(state.document);
      util.updateList(state.documents, state.document);
    } catch (e) {
      if (redirectURL == "/home") {
        pushError(e.message);
      } else {
        state.error = e.message;
      }
    }
  }
  res.redirect(redirectURL);
});

app.post("/deleteDocument", async (req, res) => {
  if (state.document == req.body.document) {
    state.document = undefined;
    state.service.helper.store = undefined;
  }
  await state.service.helper.deleteDocument(req.body.document);
  state.documents.splice(state.documents.indexOf(req.body.document), 1);
  res.redirect("/docs");
});

app.post("/createDocument", upload.single("doc"), async (req, res) => {
  const file = req.file;
  try {
    const text = await util.getTexts(file);
    const docname = req.body.docname;
    await state.service.helper.createDocument(text, docname);
  } catch (e) {
    state.error = e.message;
  }
  res.redirect("/docs");
});

app.post("/setService", (req, res) => {
  state.service.name = req.body.servicename;
  util.updateList(state.service.names, state.service.name);
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

app.get("/home", (req, res) => {
  eraseError("/home", req.get("Referer"));
  res.render("home", state);
});

app.get("/docs", (req, res) => {
  eraseError("/docs", req.get("Referer"));
  res.render("docs", state);
});

app.listen(3000, () => {
  console.log("Visit chatPDF on http://localhost:3000/");
});

function pushError(msg) {
  const errorMessage = util.makeMessage("chat-color", "ChatPDF", msg);
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
    util.updateList(state.service.names, state.service.name);
  } else {
    state.service.name = "pinecone";
    state.service.helper = getService("pinecone");
    saveService();
  }
}

function eraseError(curUrl, prevUrl) {
  // erase error when we've come from a different path
  if (prevUrl && new URL(prevUrl).pathname != curUrl) {
    state.error = undefined;
  }
}