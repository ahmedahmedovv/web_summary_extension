export const callMistralAPI = async (content, onChunk, onComplete) => {
  let totalTokens = 0;
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that rewrites articles to be clear and concise while maintaining their key information."
          },
          {
            role: "user",
            content: `Please rewrite this article in a clear and concise way: ${content}`
          }
        ],
        temperature: 0.7,
        stream: true,
        max_tokens: 50000
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) onChunk(content);
            
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
    return 'Error rewriting content';
  }
}; 