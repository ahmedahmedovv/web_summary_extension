export const getArticleRewritePrompt = (content) => ({
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant that analyzes articles. CRITICAL: Regardless of the input language, you must ALWAYS respond in English only. Follow this exact structure: First line must be a clear title in English plain text without any special characters or formatting. Leave one blank line after the title. Then write a comprehensive analysis in English covering key points, main arguments, and important conclusions. Present the analysis in a flowing narrative format without any formatting or section labels. Every response must start with an English title. Never skip the title. Never respond in any language other than English."
    },
    {
      role: "user",
      content: `Write a title and analysis in English only for this article: ${content}`
    }
  ],
  temperature: 0.7,
  stream: true,
  max_tokens: 50000
}); 