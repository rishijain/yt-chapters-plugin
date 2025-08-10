# YouTube Chapters Generator Chrome Extension

A Chrome extension that generates timestamped chapters for YouTube videos using AI-powered transcript analysis.

## Features

- **Automatic Chapter Generation**: Generates meaningful chapters with timestamps from video transcripts
- **Multi-language Support**: Supports videos with transcripts in multiple languages
- **Language Selection**: If multiple transcript languages are available, users can choose their preferred language
- **Easy Integration**: Adds a button directly to the YouTube player interface
- **Chapter Navigation**: Click on generated chapters to jump to specific timestamps

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

## Usage

### Method 1: YouTube Player Button
1. Navigate to any YouTube video
2. Look for the 📖 button in the player controls (right side)
3. Click the button to generate chapters
4. If multiple languages are available, select your preferred language
5. Generated chapters will appear below the video

### Method 2: Extension Popup
1. Click the extension icon in your Chrome toolbar while on a YouTube video page
2. Click "Generate Chapters" in the popup
3. Chapters will be generated and displayed

## Backend API Requirements

This extension requires a Ruby backend API running on `http://localhost:3000/api` by default. The API should provide:

### Endpoints

#### GET `/api/languages?video_id={video_id}`
Returns available transcript languages for a video.

**Response:**
```json
{
  "languages": [
    {
      "code": "en",
      "name": "English"
    },
    {
      "code": "es", 
      "name": "Spanish"
    }
  ]
}
```

#### GET `/api/chapters?video_id={video_id}&language={language_code}`
Returns generated chapters with timestamps.

**Response:**
```json
{
  "chapters": [
    {
      "timestamp": 0,
      "title": "Introduction"
    },
    {
      "timestamp": 120,
      "title": "Main Topic Discussion"
    },
    {
      "timestamp": 300,
      "title": "Conclusion"
    }
  ]
}
```

## Configuration

You can change the API base URL in the extension popup under "Settings".

## Files Structure

- `manifest.json` - Extension manifest
- `content.js` - Main content script that runs on YouTube pages
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `styles.css` - Styling for injected elements
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Development

The extension uses Chrome Extension Manifest V3 and requires the following permissions:
- `activeTab` - To interact with the current YouTube tab
- `storage` - To save user preferences
- Host permissions for `youtube.com` and `www.youtube.com`

## Browser Compatibility

- Chrome (Manifest V3)
- Other Chromium-based browsers that support Manifest V3