document.addEventListener('DOMContentLoaded', async function() {
  const statusDiv = document.getElementById('status');
  const generateBtn = document.getElementById('generateBtn');
  const languagesApiUrlInput = document.getElementById('languagesApiUrl');
  const chaptersApiUrlInput = document.getElementById('chaptersApiUrl');
  
  // Load saved API URLs
  const result = await chrome.storage.sync.get(['languagesApiUrl', 'chaptersApiUrl']);
  if (result.languagesApiUrl) {
    languagesApiUrlInput.value = result.languagesApiUrl;
  }
  if (result.chaptersApiUrl) {
    chaptersApiUrlInput.value = result.chaptersApiUrl;
  }
  
  // Save API URLs on change
  languagesApiUrlInput.addEventListener('change', function() {
    chrome.storage.sync.set({ languagesApiUrl: languagesApiUrlInput.value });
  });
  
  chaptersApiUrlInput.addEventListener('change', function() {
    chrome.storage.sync.set({ chaptersApiUrl: chaptersApiUrlInput.value });
  });
  
  // Check if current tab is YouTube
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url && tab.url.includes('youtube.com/watch')) {
    statusDiv.textContent = 'Ready to generate chapters';
    statusDiv.className = 'status active';
    generateBtn.disabled = false;
    
    generateBtn.addEventListener('click', async function() {
      generateBtn.textContent = 'Generating...';
      generateBtn.disabled = true;
      
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'generateChapters',
          languagesApiUrl: languagesApiUrlInput.value,
          chaptersApiUrl: chaptersApiUrlInput.value
        });
        
        setTimeout(() => {
          generateBtn.textContent = 'Generate Chapters';
          generateBtn.disabled = false;
        }, 2000);
        
      } catch (error) {
        console.error('Error:', error);
        generateBtn.textContent = 'Error - Try Again';
        generateBtn.disabled = false;
      }
    });
    
  } else {
    statusDiv.textContent = 'Navigate to a YouTube video to use this extension';
    statusDiv.className = 'status inactive';
    generateBtn.disabled = true;
  }
});