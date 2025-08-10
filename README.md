# YouTube Chapters Generator Chrome Extension

A Chrome extension that generates timestamped chapters for YouTube videos using AI-powered transcript analysis.

## Features

- **Automatic Chapter Generation**: Generates meaningful chapters with timestamps from video transcripts
- **Auto-generated Transcript Support**: Filters and uses only auto-generated transcripts (where `is_generated: true`)
- **Language Auto-selection**: Automatically selects the language if only one is available, or shows a selection modal for multiple languages
- **Chapter Navigation**: Click on generated chapters to jump to specific timestamps in the video
- **Clean Interface**: Simple popup-based interface with no clutter in the YouTube player
- **Auto Cleanup**: Automatically removes chapters when navigating to a different video
- **Close Button**: Manual close option for the chapters panel

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

## Usage

1. **Navigate to any YouTube video**
2. **Click the extension icon** in your Chrome toolbar
3. **Click "Generate Chapters"** in the popup
4. **Wait for generation to complete** - the button will show "Generating..." until done
5. **View chapters** - they will appear below the video with clickable timestamps
6. **Close chapters** - use the × button in the top-right of the chapters panel

## Backend API Requirements

This extension requires backend APIs running on:
- **Languages API**: `http://localhost:8000`
- **Chapters API**: `http://localhost:3000`

### API Endpoints

- `GET /videos/languages/{video_id}` - Returns available transcript languages for a video
- `GET /videos/{video_id}/chapters/{language_code}` - Returns generated chapters with timestamps

## Technical Details

### CORS Handling
The extension uses a background service worker to bypass CORS restrictions, eliminating the need for backend CORS configuration.

### Language Filtering
Only processes languages where `is_generated: true` in the API response, focusing on auto-generated transcripts.

### Timestamp Format
- **Display**: Uses formatted timestamps like "02:15" from the API
- **Navigation**: Uses `start_seconds` for precise video seeking

## Files Structure

- `manifest.json` - Extension manifest with background service worker
- `content.js` - Main content script that runs on YouTube pages
- `background.js` - Background service worker for API calls
- `popup.html` - Clean extension popup interface
- `popup.js` - Popup functionality and state management
- `styles.css` - Styling for chapters display and modal dialogs
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Development

The extension uses Chrome Extension Manifest V3 and requires:

### Permissions
- `activeTab` - To interact with the current YouTube tab
- `storage` - To save user preferences (currently unused but available)

## Browser Compatibility

- Chrome (Manifest V3)
- Other Chromium-based browsers that support Manifest V3