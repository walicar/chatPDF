import * as dotenv from "dotenv";
dotenv.config();
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Helper } from "./helper.js";
export class ChromaHelper extends Helper {
  constructor() {
    super();
    this.client = new ChromaClient();
  }

  async createDocument(texts, name) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const metadatas = [{}];
    try {
      const embedder = new OpenAIEmbeddingFunction({
        openai_api_key: process.env.OPENAI_API_KEY,
      });
      await this.client.createCollection({ name, embeddingFunction: embedder });
      const store = await Chroma.fromTexts(texts, metadatas, embeddings, {
        collectionName: name,
      });
      this.store = store;
      return store;
    } catch (e) {
      throw e;
    }
  }

  async deleteDocument(name) {
    try {
      const res = await this.client.deleteCollection({ name });
      return res;
    } catch (e) {
      throw e;
    }
  }

  async queryDocument(query) {
    if (this.store) {
      try {
        const docs = await this.store.similaritySearch(query, 1);
        const llm = new OpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          temperature: 0.3,
        });
        const chain = loadQAStuffChain(llm);
        const answer = await chain.call({
          input_documents: docs,
          question: query,
        });
        return answer.text;
      } catch (e) {
        throw e;
      }
    } else {
      return Error("Store does not exist");
    }
  }

  async getDocuments() {
    try {
      const list = await this.client.listCollections();
      const res = list.map((item) => item.name);
      console.log(res);
      return res;
    } catch (e) {
      throw e;
    }
  }

  async useDocument(name) {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
      this.store = await Chroma.fromExistingCollection(embeddings, {
        collectionName: name,
      });
    } catch (e) {
      throw e;
    }
  }
}
