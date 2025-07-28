import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';

const messageHistories: Record<string, ChatMessageHistory> = {};

export async function POST(req: Request) {
  const { messages, model, sessionId } = await req.json();

  const llm = new ChatOpenAI({
    modelName: model || 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
    apiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a helpful assistant. ALWAYS provide a thinking process before your answer, enclosed in <thinking> and </thinking> tags. This is a requirement for every response.'],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ]);

  const chain = prompt.pipe(llm);

  if (!messageHistories[sessionId]) {
    messageHistories[sessionId] = new ChatMessageHistory();
  }
  const messageHistory = messageHistories[sessionId];

  const withHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: () => messageHistory,
    inputMessagesKey: 'input',
    historyMessagesKey: 'history',
  });

  try {
    const result = await withHistory.invoke(
      {
        input: messages[messages.length - 1].content,
      },
      {
        configurable: {
          sessionId,
        },
      }
    );

    return NextResponse.json({ choices: [{ message: { content: result.content, role: 'assistant' } }] });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}