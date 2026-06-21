inspection-report-analyser

Environment Variables
---------------------

Create a `.env` file in the project root (you can copy `.env.example`) and set the following variables for local development:

- `GROQ_API_KEY`: Your Groq API key (server-side only). Required if you use the Groq SDK.
- `OPENAI_API_KEY`: OpenAI API key (optional, if using OpenAI provider).
- `GEMINI_API_KEY`: Google Gemini API key (optional, if using Gemini provider).

Do not commit your `.env` file or secrets to version control.