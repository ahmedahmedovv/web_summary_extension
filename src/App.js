/* global chrome */
import { useState, useEffect } from 'react';
import { callMistralAPI } from './services/mistralService';

function App() {
  const [articleContent, setArticContent] = useState('');
  const [rewrittenContent, setRewrittenContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['mistralApiKey'], (result) => {
      if (result.mistralApiKey) {
        setApiKey(result.mistralApiKey);
      }
    });
  }, []);

  const handleSaveApiKey = () => {
    chrome.storage.sync.set({ mistralApiKey: apiKey }, () => {
      setShowSettings(false);
    });
  };

  useEffect(() => {
    // Add this to ensure the side panel stays open
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    
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
        setRewrittenContent(''); // Reset content
        setLoading(true); // Show loading state while starting

        // Start streaming immediately
        await callMistralAPI(
          scrapedContent, 
          (chunk) => {
            setRewrittenContent(prev => prev + chunk);
          },
          (tokens) => {
            setTokenUsage(tokens);
          }
        );
        
      } catch (error) {
        setArticContent('Error scraping content: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    scrapeArticle();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rewrittenContent);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1000); // Reset after 1 second
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="w-[300px] min-h-screen bg-gray-100 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={handleCopy}
            disabled={loading || !rewrittenContent}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 
              ${loading || !rewrittenContent 
                ? 'bg-gray-400 cursor-not-allowed' 
                : copyFeedback 
                  ? 'bg-green-600 scale-95' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'} 
              text-white transform`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {copyFeedback ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              )}
            </svg>
            {copyFeedback ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>

        {showSettings && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Settings</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mistral API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter your Mistral API key"
              />
            </div>
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        )}

        <div className="prose prose-sm max-w-none">
          {loading && (
            <div className="flex items-center mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Rewriting...</span>
            </div>
          )}
          {rewrittenContent.split('\n').map((paragraph, index) => (
            paragraph && <p key={index} className="mb-2 text-gray-700">{paragraph}</p>
          ))}
        </div>
        
        {tokenUsage > 0 && (
          <div className="text-sm text-gray-500 mt-4">
            Tokens used: {tokenUsage}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 