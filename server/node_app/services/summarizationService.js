import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 

async function summarizeJobPost(url) {
  try {
    const scraper = `${process.env.SCRAPER_URL}/scrape?url=${url}`;
    const response = await fetch(scraper, { timeout: 60000 });

    if (!response.ok) {
      throw new Error(`Scraper API failed with status ${response.status}`);
    }

    const data = await response.json();
    const markdown = data.markdown;
  
    const prompt = `
          You are a highly skilled **job post parser and HTML generator**.

          Your goal is to **analyze the job description** provided and generate a **well-structured, clean, and readable HTML summary** suitable for rendering on a professional job listing website.

          🎯 **Key Objectives**:
          - ✅ Parse the job content accurately and generate semantic, minimal HTML
          - ✅ Highlight key phrases using **bold tags** for clarity
          - ✅ Apply **Tailwind CSS classes** for modern, clean UI styling
          - ✅ Output must be **production-ready** with logical, easy-to-read structure

          ---

          💡 **HTML Requirements**:
          - Use only the following semantic tags: \`<h2>\`, \`<h3>\`, \`<p>\`, \`<ul>\`, \`<li>\`
          - Do **NOT** use placeholder sections — only include sections with valid data
          - Structure and style with Tailwind CSS utility classes (e.g., \`text-lg font-semibold mb-2\`, \`list-disc ml-5 space-y-1\`)
          - Wrap the entire output in:
            \`<div class="job-summary space-y-6"> ... </div>\`

          ---

          📋 **Sections to Extract** (only include if content is clearly present):
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
          - <p><strong>Application Link:</strong> <a href="${url}" class="text-primary-600" target="_blank" rel="noopener noreferrer"></a></p>

          ---

          🚫 **DO NOT**:
          - ❌ Include any section with missing or ambiguous information
          - ❌ Include login prompts, cookie banners, CAPTCHAs, footers, or unrelated ads
          - ❌ Add inline styles, scripts, or unnecessary HTML attributes
          - ❌ Hallucinate or fabricate any job details or links
          - ❌ Output empty tags or placeholders (e.g., \`<h2></h2>\`, \`<ul></ul>\`)
          - ❌ Give the Job posted date if mentioned otherwise don't mention it

          ---

          🛑 **Fallback Rule**:
          If the job post is irrelevant, broken, or lacks extractable information, return:

          \`\`\`html
          <div class="job-summary">
            <h1 class="text-2xl font-bold text-red-600">Details Not Found</h1>
          </div>
          \`\`\`

          ---

          📝 **Job Post to Analyze**:
          \`\`\`markdown
          ${markdown}
          \`\`\`

          🔗 If the markdown is insufficient or empty, attempt to extract structured information directly from the provided link:
          **${url}**
          `;
    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // You can also use "gemini-pro"

    // Generate content
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return responseText;
  } catch (error) {
    throw error;
  }
}

export { summarizeJobPost };
