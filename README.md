# chatPDF

Chat with a PDF through a Web UI using OpenAI, Pinecone, and LangChain

## Requirements

- OpenAI account
- Pinecone account

## Setup

1. run `npm i`
2. create .env file and add the following:

```
OPEN_API_KEY=<your_key>
PINECONE_API_KEY=<your_key>
PINECONE_API_ENV=<your_env>
```

3. Run the server by calling `npm start`

## Using the Website

Upload a document in the docs page by creating an index in Pinecone and embedding it with your document.
To talk with the document that you uploaded, go to the home page and select the index associated with the document you uploaded and ask it a question.

## Roadmap

goal: locally hosted chat bot to interface with PDF

- In Progress: Integrate ChromaDB into ChatPDF to replace Pinecone
  - as of 5/14/23 Chroma cannot be run in-memory in JS, but can be run in a Docker container
- BLOCKED: Integrate with GPT4All TS bindings
  - as of 5/22/23 official bindings haven't been made yet

## Disclaimer

This is a test project not meant to be used in production.
