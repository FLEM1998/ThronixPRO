import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTradingStrategy() {
  const prompt = "Generate a JSON crypto trading strategy using RSI, EMA, and MACD.";
  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  });
  return JSON.parse(res.choices[0].message.content || '{}');
}