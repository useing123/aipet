# OpenRouter Chat

This is a simple chat application that uses the OpenRouter API to provide access to various large language models. It's built with Next.js, shadcn/ui, and LangChain.

## Getting Started

First, you'll need to set up your environment variables. Create a `.env.local` file in the root of the project and add your OpenRouter API key:

```
OPENROUTER_API_KEY=your_api_key_here
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

*   **Model Selection:** Choose from a variety of models to chat with.
*   **Thinking Process:** See the model's thinking process before it provides an answer.
*   **Chat History:** Your chat history is saved in your browser's local storage.
*   **Mobile-First UI:** The user interface is designed to be responsive and work well on mobile devices.

## Tech Stack

*   [Next.js](https://nextjs.org/)
*   [shadcn/ui](https://ui.shadcn.com/)
*   [LangChain](https://js.langchain.com/)
*   [Tailwind CSS](https://tailwindcss.com/)
