const axios = require('axios');
const express = require('express');

const router = express.Router();
const OpenAI = require("openai")

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

// Define the /chat route in the service file

router.post("/chat", async (request, response) => {
  const { chats } = request.body;

  try {
      const result = await client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
              {
                  role: "system",
                  content: "You are a EbereGPT. You can help with graphic design tasks",
              },
              ...chats,
          ],
      });

      response.json({
          output: result.data.choices[0].message,
      });
  } catch (error) {
      console.error("Error during OpenAI API call:", error);
      response.status(500).json({ error: "Failed to fetch response from OpenAI" });
  }
});

module.exports = router;
