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
  constructor() { super(); }

  async init() {
    const client = new PineconeClient();
    console.log('initializing')
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
    console.log("HELLI")
    console.log(texts);
    try {
      const desc = await this.describeIndex(name);
      if (desc instanceof Error) {
        console.log("trying to create Index");
        await this.createIndex(name);
        console.log("created Index");
        console.log("going to poll");
        const result = await this.poll(name);
        if (result) {
          console.log("trying to create embeddings");
          await this.createEmbeddings(texts, name);
          console.log("embeddings created")
        } else {
          console.log("index wasn't ready")
        }
      } else {
        const store = await this.useDocument(name);
        return store;
      }
    } catch (e) {
      throw e;
    }
  }

  async createEmbeddings(texts, indexName) {
    console.log("entered embeddings, gonna have to wait");
    await new Promise(r => setTimeout(r, 15000));
    console.log("stop waiting")
    const fields = { openAIApiKey: process.env.OPENAI_API_KEY };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(indexName);
    console.log(index);
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
      const answer = await chain.call({ input_documents: docs, question: query });
      return answer.text;
    } catch (e) {
      console.log(e);
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
      return e;
    }
  }

  async useDocument(name) {
    const fields = { openaiapikey: process.env.openai_api_key };
    const embeddings = new OpenAIEmbeddings(fields);
    const client = await this.init();
    const index = client.Index(name);
    const dbconfig = { pineconeIndex: index };
    try {
      const store = await PineconeStore.fromExistingIndex(
        embeddings,
        dbconfig
      );
      this.store = store;
      return store;
    } catch (e) {
      return e;
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
      await client.deleteIndex(name);
    } catch (e) {
      return error;
    }
  }

  async poll(name) {
    console.log("Starting poll");
    const time = 15000
    const limit = 20;
    const client = await this.init();
    let tries = 0;
    while (tries < limit) {
      try {
        let desc = await client.describeIndex({ indexName: name });
        console.log("POLL STATUS: " + desc.status.ready);
        if (desc.status.ready) {
          return true;
        }
      } catch (e) {
        return e;
      }
      tries++;
      await new Promise(r => setTimeout(r, time));
    }
    return false;
  }
}