import * as dotenv from "dotenv";
dotenv.config();
import { Chroma } from "langchain/vectorstores/chroma";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChromaClient, OpenAIEmbeddingFunction} from "chromadb";
import { OpenAI } from "langchain/llms/openai";
import { loadQAStuffChain } from "langchain/chains";
export class ChromaHelper {
  constructor() {
    this.currentStore = undefined;
  }
  async createEmbeddingsV2(texts, name) {
    const client = new ChromaClient();
    const embedder = new OpenAIEmbeddingFunction({openai_api_key: process.env.OPENAI_API_KEY});
    const collection = await client.createCollection({name, embeddingFunction: embedder});
    this.currentStore = collection;
  }

  async createEmbeddings(docs, name) {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const client = new ChromaClient();
    const metadatas = [{}];
    try {
      const embedder = new OpenAIEmbeddingFunction({openai_api_key: process.env.OPENAI_API_KEY});
      await client.createCollection({name, embeddingFunction: embedder});
      const store = await Chroma.fromTexts(docs, metadatas, embeddings, {
      collectionName: name,
      });
      this.store = store;
      return store;
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

  async queryDoc(query) {
    if (this.store) {
      const docs = await this.store.similaritySearch(query, 1);
      const llm = new OpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        temperature: 0.3
      })
      const chain = loadQAStuffChain(llm);
      const answer = await chain.call({input_documents: docs, question: query});
      return answer.text;
    } else {
      return Error("Store does not exist");
    }
  }


}