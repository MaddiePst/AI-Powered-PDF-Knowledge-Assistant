# AI-Powered PDF Knowledge Assistant 🤖📄

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-blue)](https://ai-powered-pdf-knowledge-assistant.vercel.app/)

A modern web application that allows you to upload PDF documents and interactively ask questions about their content. Using OpenAI’s advanced language models and embeddings, this assistant delivers **accurate, context-aware answers** directly from your documents.

Try the live demo here: [AI PDF Assistant](https://ai-powered-pdf-knowledge-assistant.vercel.app/)

---

## 🌟 Features
- **PDF Upload** – Easily upload PDFs for processing.
- **Smart Q&A** – Ask questions about the PDF content and get AI-generated answers.
- **Context Awareness** – Responses consider the full document context using embeddings.
- **Responsive Design** – Works beautifully on desktop and mobile.
- **Clean Chat Interface** – Modern and user-friendly chat-style interaction.

---

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS (for fast styling and responsive design)
- **Backend:** Vercel Serverless Functions (API endpoints)
- **AI Integration:** OpenAI GPT models & embeddings
- **PDF Processing:** `pdf-parse` for extracting text
- **Deployment:** Vercel (serverless hosting)
- **Other Tools:** JavaScript, Node.js

---

## ⚡ How It Works
1. User uploads a PDF.
2. The app extracts the text from the PDF using `pdf-parse`.
3. The extracted text is converted into embeddings for semantic search.
4. When a user asks a question, the app finds relevant passages and generates a response using OpenAI GPT.
5. The answer is displayed in a chat-style interface.

---
