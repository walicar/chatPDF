import * as dotenv from "dotenv";
dotenv.config();
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
import { Helper } from "./helper.js";

// pinecone dimensions 1536

export class PineconeHelper extends Helper {
  constructor() {
    super();
  }

  async init() {
    const client = new PineconeClient();
    try {
      await client.init({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_API_ENV,
      });
    } catch (e) {
      throw e;
    }
    return client;
  }

  async createDocument(texts, name) {
    try {
      const desc = await this.describeIndex(name);
      if (desc instanceof Error) {
        await this.createIndex(name);
        const result = await this.poll(name);
        if (result) {
          await this.createEmbeddings(texts, name);
          console.log("Document uploaded!");
        } else {
          console.log(e);
        }
      } else {
        const store = await this.useDocument(name);
        this.store = store;
      }
    } catch (e) {
      throw e;
    }
  }

  async createEmbeddings(texts, indexName) {
    await new Promise((r) => setTimeout(r, 5000));
    const fields = { openAIApiKey: process.env.OPENAI_API_KEY };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(indexName);
    const metadatas = [{}];
    const dbConfig = { pineconeIndex: index };
    try {
      const store = await PineconeStore.fromTexts(
        texts,
        metadatas,
        embeddings,
        dbConfig
      );
      this.store = store;
      return store;
    } catch (e) {
      console.log(e);
    }
  }

  async queryDocument(query) {
    try {
      const docs = await this.store.similaritySearch(query);
      const llm = new OpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.5,
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
  }

  async createIndex(name) {
    const client = await this.init();
    const createRequest = {
      name,
      dimension: 1536,
      metric: "cosine",
      podType: "p1",
    };
    try {
      await client.createIndex({ createRequest });
    } catch (e) {
      throw e;
    }
  }

  async getDocuments() {
    const client = await this.init();
    try {
      const list = await client.listIndexes();
      return list;
    } catch (e) {
      throw e;
    }
  }

  async useDocument(name) {
    const fields = { openaiapikey: process.env.openai_api_key };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(name);
    const dbconfig = { pineconeIndex: index };
    try {
      const store = await PineconeStore.fromExistingIndex(embeddings, dbconfig);
      this.store = store;
      return store;
    } catch (e) {
      throw e;
    }
  }

  async describeIndex(name) {
    const client = await this.init();
    try {
      const result = await client.describeIndex({ indexName: name });
      return result;
    } catch (e) {
      return e;
    }
  }

  async deleteDocument(name) {
    const client = await this.init();
    try {
      await client.deleteIndex({ indexName: name });
    } catch (e) {
      throw e;
    }
  }

  async poll(name) {
    const time = 15000;
    const limit = 20;
    const client = await this.init();
    let tries = 0;
    while (tries < limit) {
      try {
        let desc = await client.describeIndex({ indexName: name });
        if (desc.status.ready) {
          return true;
        }
      } catch (e) {
        throw e;
      }
      tries++;
      console.log("Waiting...");
      await new Promise((r) => setTimeout(r, time));
    }
    return false;
  }
}
