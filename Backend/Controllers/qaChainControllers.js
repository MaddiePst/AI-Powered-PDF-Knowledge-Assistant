import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getIndex } from "../Controllers/indexServiceControllers.js";

export async function askQuestion(question) {
  // Retrieves current vector index
  const index = getIndex();

  if (!index) {
    throw new Error("No index available");
  }

  // Convert LlamaIndex index → LangChain retriever
  // Retriever => Takes a question. Finds relevant vector chunks.
  const retriever = index.asRetriever();

  // Initializes OpenAI LLM.(temperature: 0: More factual, less creative, Ideal for document QA
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo",
    temperature: 0,
  });

  // Prompt template (inline for simplicity)
  const prompt = (docs, question) => `
You are an AI assistant answering questions based on the provided context.

Context:
${docs.map((d) => d.pageContent).join("\n\n")}

Question:
${question}

Answer:
`;

  // Chain that injects retrieved docs into the prompt
  // LangChain: Question → retriever, Top chunks → prompt, Prompt → LLM, Answer returned
  const chain = RunnableSequence.from([
    async (input) => {
      const docs = await retriever.invoke(input);
      return prompt(docs, input);
    },
    llm,
    new StringOutputParser(),
  ]);

  // Executes the chain, query is required input key
  const answer = await chain.invoke(question);
  // Extracts human-readable answer
  return answer;
}
