// import { pipeline } from '@xenova/transformers';

// // Initialize the embedding model (only once)
// let embedder = null;

// async function initEmbedder() {
//   if (!embedder) {
//     embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//   }
//   return embedder;
// }

// // Function to generate embedding
// async function generateEmbedding(text) {
//   const model = await initEmbedder();
//   const output = await model(text, { pooling: 'mean', normalize: true });
//   const embedding = Array.from(output.data);
//   return embedding;
// }

// // Usage example
// const questionEmbedding = await generateEmbedding("what are your skills");
// console.log(questionEmbedding); // Array of 384 numbers




import Bytez from "bytez.js"

const sdk = new Bytez("000f5eb43541d0ea7d249b2ff8911f9e")

// choose nomic-embed-text-v1.5
const model = sdk.model("nomic-ai/nomic-embed-text-v1.5")

// send input to model
const { error, output } = await model.run("John Smith went to London to sip lapsang souchong")

console.log({ error, output });