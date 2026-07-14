const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const apiKeyLine = envFile.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
if (apiKeyLine) process.env.GEMINI_API_KEY = apiKeyLine.split('=')[1].trim();

async function run() {
  console.log("Checking API Key: ", process.env.GEMINI_API_KEY?.substring(0, 5) + "...");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    if (data.models) {
      console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
    } else {
      console.log("Error from API:", data);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
