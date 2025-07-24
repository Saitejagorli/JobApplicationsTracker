import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizeJobPost({ url = "", description = "" }) {
  try {
    let markdown = description.trim();
    if (!markdown && url) {
      const scraper = `${process.env.SCRAPER_URL}/scrape?url=${url}`;
      const response = await fetch(scraper, { timeout: 60000 });

      if (!response.ok) {
        throw new Error(`Scraper API failed with status ${response.status}`);
      }

      const data = await response.json();
      markdown = data.markdown;
    }

    const prompt = `
                    You are a highly skilled **job post parser and HTML generator**.

                    Your goal is to **analyze the job description** provided and generate:
                    1. A **well-structured HTML summary** with Tailwind CSS.
                    2. A boolean flag \`success\` indicating whether extraction was successful.

                    ---

                    🎯 **Response Format (strictly JSON inside a code block):**
                    \`\`\`json
                    {
                      "success": true,
                      "html": "<div class='job-summary space-y-6'>...</div>"
                    }
                    \`\`\`

                    If the job post is irrelevant, broken, or lacks extractable information, return:
                    \`\`\`json
                    {
                      "success": false,
                      "html": "<div class='job-summary'><h1 class='text-2xl font-bold text-red-600'>Details Not Found</h1></div>"
                    }
                    \`\`\`

                    ---

                    📋 **HTML Requirements**:
                    - Use only semantic tags: \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`
                    - Highlight key phrases using **<strong>** or **<b>** tags
                    - Use Tailwind CSS classes for layout and style
                    - Wrap entire output in:
                      \`<div class="job-summary space-y-6"> ... </div>\`

                    ---

                    📌 **Sections to Extract** (include only if present):
                    - <h2 class="text-2xl font-bold">Job Title</h2>
                    - <p class="text-base"><strong>Company:</strong> ...</p>
                    - <p><strong>Location:</strong> ...</p>
                    - <p><strong>Employment Type:</strong> ...</p>
                    - <p><strong>Experience Level:</strong> ...</p>
                    - <p><strong>Salary / Compensation:</strong> ...</p>

                    - <h3 class="text-xl font-semibold mt-6">Responsibilities</h3>
                      <ul class="list-disc ml-6 space-y-1">
                        <li>...</li>
                      </ul>

                    - <h3 class="text-xl font-semibold mt-6">Required Skills / Technologies</h3>
                      <ul class="list-disc ml-6 space-y-1">
                        <li>...</li>
                      </ul>

                    - <h3 class="text-xl font-semibold mt-6">Preferred Skills</h3>
                      <ul class="list-disc ml-6 space-y-1">
                        <li>...</li>
                      </ul>

                    - <h3 class="text-xl font-semibold mt-6">Benefits / Perks</h3>
                      <ul class="list-disc ml-6 space-y-1">
                        <li>...</li>
                      </ul>

                    - <h3 class="text-xl font-semibold mt-6">Application Process</h3>
                      <p>...</p>

                    - <p><strong>Posted Date:</strong> ...</p>
                    - <p><strong>Application Deadline:</strong> ...</p>
                    - <p><strong>Application Link:</strong> <a href="${url}" class="text-primary-600" target="_blank" rel="noopener noreferrer">${url}</a></p>

                    ---

                    🚫 **Do NOT**:
                    - ❌ Include sections with missing or vague content
                    - ❌ Add inline styles, scripts, or unused HTML
                    - ❌ Fabricate any job details
                    - ❌ Include cookie banners, ads, login prompts, or CAPTCHAs
                    - ❌ Output empty elements (e.g., \`<h2></h2>\`)

                    ---

                    📝 **Job Post to Analyze**:
                    \`\`\`markdown
                    ${markdown}
                    \`\`\`

                    🔗 **Source**: ${url || "N/A"}
                    `;

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // You can also use "gemini-pro"

    // Generate content
    const result = await model.generateContent(prompt);

    const responseText = result.response.text();

    // Extract JSON from response text
    const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) throw new Error("Invalid response format from Gemini.");

    const parsed = JSON.parse(match[1]);

    return parsed;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export { summarizeJobPost };
