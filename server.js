require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;
// const HF_API_KEY = "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"; // 🔑 Hugging Face API token


app.get('/test', (req, res) => {
  res.send("Server working ✅");
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://router.huggingface.co/novita/v3/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + HF_API_KEY
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
          temperature: 0.3
        })
      }
    );

    const text = await response.text();
    console.log("HF raw response:", text.slice(0, 300)); // debug log

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ error: "Invalid response: " + text.slice(0, 200) });
    }

    if (data.error) {
      return res.status(400).json({ error: JSON.stringify(data.error) });
    }

    const result = data.choices?.[0]?.message?.content || "[]";
    res.json({ text: result });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(express.static('.'));
app.listen(3000, () => console.log('✅ Server running on http://localhost:3000'));
