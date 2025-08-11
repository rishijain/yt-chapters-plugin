class YouTubeChaptersGenerator {
  constructor() {
    console.log('YouTubeChaptersGenerator: Initializing...');
    this.languagesApiUrl = 'http://localhost:8000';
    this.chaptersApiUrl = 'http://localhost:3000';
    this.currentVideoId = null;
    this.init();
  }

  init() {
    console.log('YouTubeChaptersGenerator: Starting init...');
    this.observeVideoChanges();
    this.checkCurrentVideo();
  }

  observeVideoChanges() {
    const observer = new MutationObserver(() => {
      this.checkCurrentVideo();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkCurrentVideo() {
    const videoId = this.extractVideoId();
    console.log('YouTubeChaptersGenerator: Checking video ID:', videoId);
    console.log('YouTubeChaptersGenerator: Current stored ID:', this.currentVideoId);
    
    if (videoId && videoId !== this.currentVideoId) {
      // Clear previous chapters when navigating to a new video
      this.clearPreviousChapters();
      
      this.currentVideoId = videoId;
      console.log('YouTubeChaptersGenerator: New video detected');
    }
  }

  extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  clearPreviousChapters() {
    console.log('YouTubeChaptersGenerator: Clearing previous chapters...');
    const existingChapters = document.querySelector('.yt-chapters-list');
    if (existingChapters) {
      existingChapters.remove();
      console.log('YouTubeChaptersGenerator: Previous chapters removed');
    }
  }


  async handleGenerateChapters() {
    console.log('Starting chapter generation...');
    console.log('Current video ID:', this.currentVideoId);
    console.log('Languages API URL:', this.languagesApiUrl);
    console.log('Chapters API URL:', this.chaptersApiUrl);

    if (!this.currentVideoId) {
      console.error('No video ID found');
      this.showMessage('No video ID found. Make sure you are on a YouTube video page.');
      return;
    }

    try {
      console.log('Fetching available languages...');
      const languages = await this.fetchAvailableLanguages(this.currentVideoId);
      console.log('Languages fetched:', languages);
      
      if (languages.length === 0) {
        this.showMessage('No transcripts available for this video');
        return;
      }

      let selectedLanguage;
      if (languages.length === 1) {
        selectedLanguage = languages[0];
        console.log('Single language selected:', selectedLanguage);
      } else {
        console.log('Multiple languages available, showing selector...');
        selectedLanguage = await this.showLanguageSelector(languages);
        if (!selectedLanguage) {
          console.log('No language selected by user');
          return;
        }
        console.log('User selected language:', selectedLanguage);
      }

      console.log('Fetching chapters...');
      const chapters = await this.fetchChapters(this.currentVideoId, selectedLanguage);
      console.log('Chapters fetched:', chapters);
      
      this.injectChapters(chapters);
      this.showMessage('Chapters generated successfully!');
      
    } catch (error) {
      console.error('Error generating chapters:', error);
      console.error('Error stack:', error.stack);
      this.showMessage(`Error: ${error.message}. Check console for details.`);
    }
  }

  async fetchAvailableLanguages(videoId) {
    console.log('Content: Requesting languages from background script...');
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'fetchLanguages',
        videoId: videoId,
        apiUrl: this.languagesApiUrl
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Content: Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          console.log('Content: Languages fetched successfully:', response.data);
          // Parse the actual API response format and filter for is_generated: true
          const availableLanguages = response.data.available_languages || [];
          const filteredLanguages = availableLanguages
            .filter(lang => lang.is_generated === true)
            .map(lang => ({
              code: lang.language_code,
              name: lang.language
            }));
          console.log('Content: Filtered languages (is_generated: true):', filteredLanguages);
          resolve(filteredLanguages);
        } else {
          console.error('Content: Languages fetch failed:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  async fetchChapters(videoId, language) {
    console.log('Content: Requesting chapters from background script...');
    
    // Extract video title from DOM
    const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent || 'Unknown Title';
    console.log('Content: Extracted video title:', videoTitle);
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'fetchChapters',
        videoId: videoId,
        language: language,
        videoTitle: videoTitle,
        apiUrl: this.chaptersApiUrl
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Content: Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          console.log('Content: Chapters fetched successfully:', response.data);
          resolve(response.data.chapters || []);
        } else {
          console.error('Content: Chapters fetch failed:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  showLanguageSelector(languages) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'yt-chapters-modal';
      modal.innerHTML = `
        <div class="yt-chapters-modal-content">
          <h3>Select Language</h3>
          <div class="language-options">
            ${languages.map(lang => `
              <button class="language-option" data-lang="${lang.code}">
                ${lang.name}
              </button>
            `).join('')}
          </div>
          <button class="cancel-btn">Cancel</button>
        </div>
      `;

      modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('language-option')) {
          const selectedLang = languages.find(lang => lang.code === e.target.dataset.lang);
          resolve(selectedLang);
          modal.remove();
        } else if (e.target.classList.contains('cancel-btn') || e.target === modal) {
          resolve(null);
          modal.remove();
        }
      });

      document.body.appendChild(modal);
    });
  }

  injectChapters(chapters) {
    console.log('Injecting chapters:', chapters);
    
    const existingChapters = document.querySelector('.yt-chapters-list');
    if (existingChapters) {
      existingChapters.remove();
    }

    const player = document.querySelector('#movie_player');
    if (!player) return;

    const chaptersContainer = document.createElement('div');
    chaptersContainer.className = 'yt-chapters-list';
    
    // Create header with title and close button
    const chaptersHeader = document.createElement('div');
    chaptersHeader.className = 'yt-chapters-header';
    
    const chaptersTitle = document.createElement('h4');
    chaptersTitle.textContent = 'Generated Chapters';
    chaptersTitle.className = 'yt-chapters-title';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'yt-chapters-close';
    closeButton.innerHTML = '×';
    closeButton.title = 'Close chapters';
    closeButton.addEventListener('click', () => {
      console.log('YouTubeChaptersGenerator: Close button clicked');
      chaptersContainer.remove();
    });
    
    chaptersHeader.appendChild(chaptersTitle);
    chaptersHeader.appendChild(closeButton);
    chaptersContainer.appendChild(chaptersHeader);

    chapters.forEach((chapter, index) => {
      console.log(`Chapter ${index}:`, chapter);
      console.log(`Timestamp: "${chapter.timestamp}", Type: ${typeof chapter.timestamp}`);
      console.log(`Name: "${chapter.name}"`);
      console.log(`Start seconds: ${chapter.start_seconds}`);
      
      const chapterElement = document.createElement('div');
      chapterElement.className = 'yt-chapter-item';
      
      // Use the timestamp directly since it's already formatted as "MM:SS"
      const displayTime = chapter.timestamp || '0:00';
      // Use start_seconds for seeking since video.currentTime expects seconds
      const seekTime = chapter.start_seconds || 0;
      
      console.log(`Display time: ${displayTime}, Seek time: ${seekTime}`);
      
      chapterElement.innerHTML = `
        <span class="chapter-time" data-time="${seekTime}">${displayTime}</span>
        <span class="chapter-title">${chapter.name || 'Untitled Chapter'}</span>
      `;
      
      chapterElement.addEventListener('click', () => {
        console.log(`Seeking to ${seekTime} seconds`);
        this.seekToTime(seekTime);
      });
      
      chaptersContainer.appendChild(chapterElement);
    });

    const videoSecondaryInfo = document.querySelector('#secondary-inner');
    if (videoSecondaryInfo) {
      videoSecondaryInfo.insertBefore(chaptersContainer, videoSecondaryInfo.firstChild);
    }
  }

  seekToTime(timestamp) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = timestamp;
    }
  }

  formatTime(timestamp) {
    // Handle various timestamp formats
    let seconds;
    
    if (typeof timestamp === 'string') {
      // If it's already in "MM:SS" or "HH:MM:SS" format, return as-is
      if (timestamp.includes(':')) {
        return timestamp;
      }
      // If it's a string number, parse it
      seconds = parseFloat(timestamp);
    } else if (typeof timestamp === 'number') {
      seconds = timestamp;
    } else {
      console.error('Invalid timestamp format:', timestamp);
      return '0:00';
    }
    
    // Check if parsing resulted in NaN
    if (isNaN(seconds)) {
      console.error('Timestamp parsed to NaN:', timestamp);
      return '0:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }


  showMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'yt-chapters-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateChapters') {
    const generator = window.ytChaptersGenerator;
    if (generator) {
      // Call async function and respond when complete
      generator.handleGenerateChapters()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep the message channel open for async response
    } else {
      sendResponse({ success: false, error: 'Generator not initialized' });
    }
  }
});

console.log('YouTubeChaptersGenerator: Content script loaded');
console.log('YouTubeChaptersGenerator: Current hostname:', window.location.hostname);
console.log('YouTubeChaptersGenerator: Current URL:', window.location.href);

if (window.location.hostname.includes('youtube.com')) {
  console.log('YouTubeChaptersGenerator: On YouTube, creating generator...');
  window.ytChaptersGenerator = new YouTubeChaptersGenerator();
} else {
  console.log('YouTubeChaptersGenerator: Not on YouTube, skipping initialization');
}