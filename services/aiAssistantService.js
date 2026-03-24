const OpenAI = require("openai");
const logger = require("../utils/logger");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// This function uses the Google Gemini API to generate a clean HTML explanation.
exports.generateExplanation = async ({
  question,
  options,
  correctanswer,
  useranswer
}) => {

  // 🔥 FIX: convert to numbers
  correctanswer = Number(correctanswer);
  useranswer = Number(useranswer);

  const letters = ["A", "B", "C", "D"];

  const correctLetter = letters[correctanswer - 1] || "";

  const userLetter = useranswer === -1
    ? "Not Attempted"
    : letters[useranswer - 1] || "";


  const prompt = `
You are a helpful biology tutor.

Question:
${question}

Options:
A. ${options[0]}
B. ${options[1]}
C. ${options[2]}
D. ${options[3]}

Correct Answer: ${correctLetter}
User Answer: ${userLetter}

Instructions:
- Return ONLY clean HTML (no markdown, no backticks)
- For the options list (<ul>), add class "correct" to the correct option, e.g.:

<ul>
  <li class="${correctLetter === 'A' ? 'correct' : ''}"><strong>A:</strong> explanation</li>
  <li class="${correctLetter === 'B' ? 'correct' : ''}"><strong>B:</strong> explanation</li>
  <li class="${correctLetter === 'C' ? 'correct' : ''}"><strong>C:</strong> explanation</li>
  <li class="${correctLetter === 'D' ? 'correct' : ''}"><strong>D:</strong> explanation</li>
</ul>

- Only the correct option should have the "correct" class
- Keep it short, exam-focused, and use A, B, C, D only
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    return data?.candidates?.[0]?.content?.parts?.[0]?.text
      || "No explanation available";

  } catch (err) {
    logger.error("Error generating AI explanation by gemini AI:", err);
    return "Error generating explanation";
  }
};

/**
 * Generates an AI explanation for a given question, options, correct answer, and user answer.
 * This function uses the OpenAI API to generate a clean HTML explanation.
 * @param {Object} params - An object containing the question, options, correct answer, and user answer.
 * @param {string} params.question - The question being asked.
 * @param {string[]} params.options - An array of the options for the question.
 * @param {number} params.correctanswer - The correct answer for the question.
 * @param {number} params.useranswer - The user's answer for the question.
 * @returns {Promise<string>} - A promise that resolves to the AI explanation as a string.
 */
exports.generateExplanation2 = async ({ question, options, correctanswer, useranswer }) => {

  const letters = ["A", "B", "C", "D"];

  // Convert correct answer and user answer to numbers
  correctanswer = Number(correctanswer);
  useranswer = Number(useranswer);

  // Get the correct letter and user letter from the options array
  const correctLetter = letters[correctanswer - 1] || "";
  const userLetter = useranswer === -1 ? "Not Attempted" : letters[useranswer - 1] || "";

  // Create the prompt for the AI model
  const prompt = `
You are a helpful biology tutor.

Question:
${question}

Options:
A. ${options[0]}
B. ${options[1]}
C. ${options[2]}
D. ${options[3]}

Correct Answer: ${correctLetter}
User Answer: ${userLetter}

Instructions:
- Return ONLY clean HTML (no markdown, no backticks)
- Use this format:

<div class="ai-explanation">
  <p class="ai-correct">The correct answer is <strong>B. Option text</strong></p>
  <ul>
    <li><strong>A:</strong> explanation</li>
    <li><strong>B:</strong> explanation</li>
    <li><strong>C:</strong> explanation</li>
    <li><strong>D:</strong> explanation</li>
  </ul>
</div>

- Always use A, B, C, D only
- Keep it short and exam-focused
`;

  try {
    // Use the OpenAI API to generate the explanation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-4" if you have access
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    // Get the explanation from the response
    const explanation = response.choices?.[0]?.message?.content;
    
    return explanation || "No explanation available";

  } catch (err) {
    // Log any errors to the log file
    logger.error("Error generating AI explanation by openAI:", err);
    return "Error generating explanation";
  }
};
