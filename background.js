// Background script to handle API calls and bypass CORS

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchLanguages') {
    fetchLanguages(request.videoId, request.apiUrl)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
  
  if (request.action === 'fetchChapters') {
    fetchChapters(request.videoId, request.language, request.apiUrl, request.videoTitle)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

async function fetchLanguages(videoId, apiUrl) {
  const url = `${apiUrl}/videos/languages/${videoId}`;
  console.log('Background: Fetching languages from:', url);
  
  const response = await fetch(url);
  console.log('Background: Languages API response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Background: Languages API error:', errorText);
    throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Background: Languages API response data:', data);
  return data;
}

async function fetchChapters(videoId, language, apiUrl, videoTitle) {
  const languageCode = typeof language === 'object' ? language.code : language;
  const url = `${apiUrl}/videos/${videoId}/chapters/${languageCode}?title=${encodeURIComponent(videoTitle)}`;
  console.log('Background: Fetching chapters from:', url);
  
  const response = await fetch(url);
  console.log('Background: Chapters API response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Background: Chapters API error:', errorText);
    throw new Error(`Failed to fetch chapters: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Background: Chapters API response data:', data);
  return data;
}