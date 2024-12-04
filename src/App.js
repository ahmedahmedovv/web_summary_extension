/* global chrome */
import { useState, useEffect } from 'react';
import { callMistralAPI } from './services/mistralService';

function App() {
  const [articleContent, setArticContent] = useState('');
  const [rewrittenContent, setRewrittenContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scrapeArticle = async () => {
      try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Execute script in the tab to scrape content
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => {
            // Try different selectors commonly used for main content
            const selectors = [
              'article',
              '[role="article"]',
              '.article-content',
              '.post-content',
              'main',
              // Add more selectors as needed
            ];

            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                // Clean up the content
                return element.innerText
                  .replace(/\s+/g, ' ')
                  .trim();
              }
            }
            
            return 'No article content found';
          },
        });

        const scrapedContent = result.result;
        setArticContent(scrapedContent);
        
        // Updated API call using imported function
        const rewritten = await callMistralAPI(scrapedContent);
        setRewrittenContent(rewritten);
        
        setLoading(false);
      } catch (error) {
        setArticContent('Error scraping content: ' + error.message);
        setLoading(false);
      }
    };

    scrapeArticle();
  }, []);

  return (
    <div className="w-[400px] h-[500px] bg-gray-100 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold text-blue-600 mb-4">
          Rewritten Article
        </h1>
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            {rewrittenContent.split('\n').map((paragraph, index) => (
              paragraph && <p key={index} className="mb-2 text-gray-700">{paragraph}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 