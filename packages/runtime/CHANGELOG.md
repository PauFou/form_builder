# Changelog

## [1.1.0] - 2025-09-10

### Added

- 🔌 **Offline Support**: Complete IndexedDB integration with autosave
  - Automatic form progress saving (throttled to 5s)
  - Resume links for incomplete forms
  - Sync with server when connection restored
  - Offline/online status indicators
- 🛡️ **Anti-Spam Protection**: Built-in bot detection
  - Honeypot field (invisible to users)
  - Minimum completion time validation (default 3s)
  - Customizable spam detection callbacks
- 🎭 **Embed Types**: New popover and drawer modes
  - PopoverEmbed: Modal-style form overlay
  - DrawerEmbed: Slide-in side panel
  - Full keyboard navigation and a11y support
  - Smooth animations with customizable duration
- ⚡ **Performance Improvements**
  - Bundle size reduced to <10KB gzipped
  - P95 step navigation under 400ms
  - Throttled partial saves to reduce API calls

### Changed

- Updated RuntimeConfig to support new features
- Enhanced FormViewer with offline status display
- Improved error handling in submission flow

### Fixed

- Fixed IndexedDB key collision issues
- Fixed anti-spam validation timing
- Fixed cleanup of old submissions

## [1.0.0] - 2025-09-01

### Added

- Initial release
- Core form rendering engine
- SSR support
- Basic validation
- Theme customization
- Progress tracking
