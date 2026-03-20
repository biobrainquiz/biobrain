const OpenAI = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generateExplanation2 = async ({ question, options, correctanswer, useranswer }) => {

  correctanswer = Number(correctanswer);
  useranswer = Number(useranswer);

  const letters = ["A", "B", "C", "D"];
  const correctLetter = letters[correctanswer - 1] || "";
  const userLetter = useranswer === -1 ? "Not Attempted" : letters[useranswer - 1] || "";

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
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-4" if you have access
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const explanation = response.choices?.[0]?.message?.content;
    return explanation || "No explanation available";

  } catch (err) {
    console.error("OpenAI API Error:", err);
    return "Error generating explanation";
  }
};

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

    console.log({
        question,
        options,
        correctanswer,
        useranswer
    });

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

- Use A, B, C, D only (never numbers)
- Keep it short and exam-focused
`;

    console.log("PROMPT:\n", prompt);

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

        console.log("AI RAW RESPONSE:\n", JSON.stringify(data, null, 2));

        return data?.candidates?.[0]?.content?.parts?.[0]?.text
            || "No explanation available";

    } catch (err) {
        console.error("AI Service Error:", err);
        return "Error generating explanation";
    }
};
