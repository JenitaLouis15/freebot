import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const conversations = {};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, sessionId = "default" } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });

  if (!conversations[sessionId]) {
    conversations[sessionId] = [{
      role: "system",
      content: "You are QUERYBOT, an expert AI Learning Assistant. Explain topics clearly, break down complex concepts into simple steps. Be warm, supportive and educational."
    }];
  }

  conversations[sessionId].push({ role: "user", content: message.trim() });

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: conversations[sessionId],
      max_tokens: 1024,
    });

    const reply = response.choices[0].message.content;
    conversations[sessionId].push({ role: "assistant", content: reply });

    if (conversations[sessionId].length > 22) {
      conversations[sessionId] = [
        conversations[sessionId][0],
        ...conversations[sessionId].slice(-20)
      ];
    }

    res.json({ reply });

  } catch (err) {
    console.error("Groq Error:", err.message);
    res.status(500).json({ error: "AI service failed. Try again." });
  }
}
