document.addEventListener('DOMContentLoaded', async function() {
  const statusDiv = document.getElementById('status');
  const generateBtn = document.getElementById('generateBtn');
  
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
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'generateChapters'
        });
        
        if (response.success) {
          generateBtn.textContent = 'Generate Chapters';
          generateBtn.disabled = false;
        } else {
          generateBtn.textContent = 'Error - Try Again';
          generateBtn.disabled = false;
        }
        
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