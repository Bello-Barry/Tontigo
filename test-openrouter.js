const { streamText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const result = await streamText({
      model: openrouter('google/gemini-2.0-flash-001'),
      messages: [{ role: 'user', content: 'Bonjour' }],
    });

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\nDone');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
