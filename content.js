class YouTubeChaptersGenerator {
  constructor() {
    console.log('YouTubeChaptersGenerator: Initializing...');
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
    console.log('Chapters API URL:', this.chaptersApiUrl);

    if (!this.currentVideoId) {
      console.error('No video ID found');
      this.showMessage('No video ID found. Make sure you are on a YouTube video page.');
      return;
    }

    try {
      this.showMessage('Starting audio download...');
      
      console.log('Starting audio download...');
      const downloadResponse = await this.startAudioDownload(this.currentVideoId);
      console.log('Download started:', downloadResponse);
      
      const jobId = downloadResponse.job_id;
      if (!jobId) {
        throw new Error('No job_id received from download API');
      }

      this.showMessage('Processing audio... This may take a few minutes.');
      
      console.log('Polling job status for job ID:', jobId);
      const finalResponse = await this.pollForCompletion(jobId);
      console.log('Job completed:', finalResponse);
      
      if (finalResponse.status === 'completed' && finalResponse.data && finalResponse.data.chapters) {
        console.log('Chapters received:', finalResponse.data.chapters);
        this.injectChapters(finalResponse.data.chapters);
        this.showMessage('Chapters generated successfully!');
      } else {
        throw new Error('Job completed but no chapters data received');
      }
      
    } catch (error) {
      console.error('Error generating chapters:', error);
      console.error('Error stack:', error.stack);
      this.showMessage(`Error: ${error.message}. Check console for details.`);
    }
  }

  async startAudioDownload(videoId) {
    console.log('Content: Starting audio download for video:', videoId);
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'downloadAudio',
        videoId: videoId,
        apiUrl: this.chaptersApiUrl
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Content: Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          console.log('Content: Audio download started successfully:', response.data);
          resolve(response.data);
        } else {
          console.error('Content: Audio download failed:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  async pollForCompletion(jobId) {
    console.log('Content: Starting to poll for job completion:', jobId);
    
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    const pollInterval = 5000; // 5 seconds
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Content: Polling attempt ${attempt}/${maxAttempts} for job ${jobId}`);
      
      try {
        const response = await this.checkJobStatus(jobId);
        console.log('Content: Job status response:', response);
        
        if (response.status === 'completed') {
          console.log('Content: Job completed successfully');
          return response;
        } else if (response.status === 'failed') {
          throw new Error(`Job failed: ${response.message || 'Unknown error'}`);
        } else if (response.status === 'processing' || response.status === 'pending') {
          console.log(`Content: Job still ${response.status}, waiting...`);
          if (attempt < maxAttempts) {
            await this.sleep(pollInterval);
          }
        } else {
          console.warn('Content: Unknown job status:', response.status);
          if (attempt < maxAttempts) {
            await this.sleep(pollInterval);
          }
        }
      } catch (error) {
        console.error(`Content: Error on polling attempt ${attempt}:`, error);
        if (attempt === maxAttempts) {
          throw error;
        }
        await this.sleep(pollInterval);
      }
    }
    
    throw new Error('Job did not complete within the maximum time limit');
  }

  async checkJobStatus(jobId) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'pollJobStatus',
        jobId: jobId,
        apiUrl: this.chaptersApiUrl
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Content: Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          resolve(response.data);
        } else {
          console.error('Content: Job status check failed:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      console.log(`Start time: ${chapter.start_time}, End time: ${chapter.end_time}`);
      console.log(`Headline: "${chapter.headline}"`);
      console.log(`Summary: "${chapter.summary}"`);
      
      const chapterElement = document.createElement('div');
      chapterElement.className = 'yt-chapter-item';
      
      // Convert milliseconds to seconds for seeking
      const seekTimeMs = chapter.start_time || 0;
      const seekTime = Math.floor(seekTimeMs / 1000);
      
      // Format time for display
      const displayTime = this.formatTime(seekTime);
      
      console.log(`Display time: ${displayTime}, Seek time: ${seekTime} seconds`);
      
      chapterElement.innerHTML = `
        <span class="chapter-time" data-time="${seekTime}">${displayTime}</span>
        <span class="chapter-title">${chapter.headline || 'Untitled Chapter'}</span>
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