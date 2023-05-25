import * as dotenv from "dotenv";
dotenv.config();
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChromaClient } from "chromadb";
export class ChromaHelper {
  constructor() {
    this.currentStore = undefined;
  }

  async createEmbeddings(docs, name) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const metadatas = [{}];
    const store = await Chroma.fromTexts(texts, metadatas, embeddings, {
      collectionName: name,
    });
    this.store = store;
  }

  async createCollection(name) {
    const client = new ChromaClient();
    try {
      const res = await client.createCollection({ name });
      return res;
    } catch (e) {
      return e;
    }
  }

  async deleteCollection(name) {
    const client = new ChromaClient();
    try {
      const res = await client.deleteCollection({ name });
      return res;
    } catch (e) {
      return e;
    }
  }


}