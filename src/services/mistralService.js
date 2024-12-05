import { getArticleRewritePrompt } from './prompts/articleRewritePrompt';

export const callMistralAPI = async (content, onChunk, onComplete) => {
  let totalTokens = 0;
  let isComplete = false;
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        ...getArticleRewritePrompt(content)
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (!isComplete) {
      const { done, value } = await reader.read();
      if (done) {
        isComplete = true;
        break;
      }
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            isComplete = true;
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) onChunk(content);
            
            if (parsed.choices[0].finish_reason === 'stop') {
              isComplete = true;
            }
            
            if (parsed.usage) {
              totalTokens = parsed.usage.total_tokens;
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    }
    
    if (onComplete) {
      onComplete(totalTokens);
    }
    
  } catch (error) {
    console.error('Error calling Mistral API:', error);
    throw new Error('Error rewriting content');
  }
}; 