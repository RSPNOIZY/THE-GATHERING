# NOIZYLAB Check-In System - Core Systems Documentation

## 🏗️ Architecture Overview

The system is built with a modular, layered architecture:

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│      (HTML, CSS, UI Components)     │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Application Layer (app.js)     │
│    (Business Logic, Orchestration)  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         Core Systems Layer           │
│  ┌──────────┐  ┌──────────┐         │
│  │   API    │  │   Data   │         │
│  │  Client  │  │ Manager  │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐         │
│  │Validator │  │  Error   │         │
│  │          │  │ Handler  │         │
│  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐         │
│  │  Config  │  │  Utils   │         │
│  │ Manager  │  │          │         │
│  └──────────┘  └──────────┘         │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Network Scanner Layer          │
│    (DGS1210-10 Switch Integration)  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Storage Layer                  │
│  (LocalStorage / Backend API)       │
└─────────────────────────────────────┘
```

## 📦 Core Systems

### 1. API Client (`core/api.js`)

**Purpose**: Backend API integration layer

**Features**:
- HTTP request handling with retry logic
- Automatic error handling
- Request/response interceptors
- Timeout management
- Authentication token management

**Usage**:
```javascript
// GET request
const response = await checkInAPI.getCheckIns({ status: 'checked-in' });

// POST request
const response = await checkInAPI.createCheckIn(checkInData);

// Error handling
try {
    await checkInAPI.getCheckIn(id);
} catch (error) {
    if (error.status === 404) {
        // Handle not found
    }
}
```

**Configuration**:
- Base URL: Configurable via `window.API_BASE_URL`
- Timeout: 30 seconds default
- Retry attempts: 3 default
- Retry delay: 1 second (exponential backoff)

### 2. Data Manager (`core/data-manager.js`)

**Purpose**: Centralized data management and state

**Features**:
- Local storage fallback
- Backend sync queue
- Event-driven updates
- Automatic persistence
- Data filtering and sorting
- Statistics calculation

**Usage**:
```javascript
// Add check-in
await dataManager.addCheckIn(checkInData);

// Update check-in
await dataManager.updateCheckIn(id, updates);

// Get filtered check-ins
const checkIns = dataManager.getCheckIns({
    search: 'john',
    status: 'checked-in',
    date: 'today'
});

// Get statistics
const stats = dataManager.getStatistics();

// Event listeners
dataManager.on('checkin-added', (checkIn) => {
    console.log('New check-in:', checkIn);
});
```

**Data Flow**:
1. User action → Data Manager
2. Data Manager → Local storage (immediate)
3. Data Manager → Sync queue (if backend enabled)
4. Sync processor → Backend API
5. Event notification → UI update

### 3. Validator (`core/validator.js`)

**Purpose**: Data validation and sanitization

**Features**:
- Email validation
- Phone number validation
- Name validation
- Input sanitization
- Check-in data validation
- Phone number formatting

**Usage**:
```javascript
// Validate email
const result = Validator.validateEmail('user@example.com');
if (!result.valid) {
    console.error(result.error);
}

// Validate check-in
const validation = Validator.validateCheckIn(checkInData);
if (!validation.valid) {
    validation.errors.forEach(error => {
        console.error(`${error.field}: ${error.message}`);
    });
}

// Sanitize data
const sanitized = Validator.sanitizeCheckIn(rawData);
```

**Validation Rules**:
- Name: 2-100 characters, letters/spaces/hyphens only
- Email: Valid format, max 254 characters
- Phone: 10-15 digits (optional)
- Purpose: Required
- Other purpose: Required if purpose is "other"

### 4. Error Handler (`core/error-handler.js`)

**Purpose**: Centralized error handling and logging

**Features**:
- Error categorization
- User-friendly messages
- Error logging
- Backend error reporting
- Global error handlers
- Error history

**Usage**:
```javascript
// Handle error
errorHandler.handle(error, { type: 'checkin', context: 'create' });

// Handle API error
errorHandler.handleAPIError(error, '/api/checkins', 'POST');

// Handle validation error
errorHandler.handleValidationError(errors, data);

// Get user-friendly message
const message = errorHandler.getUserFriendlyMessage(error);
```

**Error Types**:
- Validation errors
- API errors
- Network errors
- Component errors
- Global errors

### 5. Config Manager (`core/config.js`)

**Purpose**: Centralized configuration management

**Features**:
- Hierarchical configuration
- Local storage persistence
- Configuration validation
- Import/export
- Event notifications

**Usage**:
```javascript
// Get config
const apiURL = configManager.get('api.baseURL');

// Set config
configManager.set('api.timeout', 60000);

// Reset to defaults
configManager.reset();

// Export config
const configJSON = configManager.export();

// Import config
configManager.import(configJSON);
```

**Configuration Structure**:
- API settings
- Network scanner settings
- Data management settings
- UI preferences
- Validation rules
- Feature flags
- Performance settings
- Security settings

### 6. Utils (`core/utils.js`)

**Purpose**: Common utility functions

**Features**:
- Debounce/throttle
- Date/time formatting
- String manipulation
- Array operations
- Object utilities
- File operations
- Clipboard operations

**Usage**:
```javascript
// Debounce
const debouncedSearch = Utils.debounce(searchFunction, 300);

// Format date
const formatted = Utils.formatDate(new Date(), 'en-US');

// Format duration
const duration = Utils.formatDuration(3600000); // "1h"

// Generate ID
const id = Utils.generateId('checkin');

// Deep clone
const cloned = Utils.deepClone(object);

// Escape HTML
const safe = Utils.escapeHtml(userInput);
```

## 🔄 Data Flow

### Check-In Flow
```
1. User fills form
   ↓
2. Validator validates data
   ↓
3. Data Manager adds check-in
   ↓
4. Network Scanner scans devices
   ↓
5. Check-in saved (local + backend)
   ↓
6. Event fired → UI updates
```

### Check-Out Flow
```
1. User clicks check-out
   ↓
2. Validator validates notes
   ↓
3. Network Scanner final scan
   ↓
4. Data Manager updates check-in
   ↓
5. Status changed to 'checked-out'
   ↓
6. Event fired → UI updates
```

### Sync Flow
```
1. Data change detected
   ↓
2. Added to sync queue
   ↓
3. Sync processor runs
   ↓
4. API request sent
   ↓
5. Success → Remove from queue
   ↓
6. Error → Retry or notify
```

## 🎯 Best Practices

### Error Handling
- Always use try-catch for async operations
- Provide user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully

### Data Validation
- Validate on client side
- Sanitize all user input
- Validate on server side (when backend available)
- Show clear error messages

### Performance
- Use debounce for search
- Lazy load data when possible
- Cache frequently accessed data
- Optimize render cycles

### Security
- Sanitize all inputs
- Validate all outputs
- Use HTTPS in production
- Implement rate limiting
- Follow OWASP guidelines

## 🔧 Configuration

### Environment Variables
```javascript
// Set API base URL
window.API_BASE_URL = 'https://api.noizylab.com';

// Enable backend mode
configManager.set('data.useBackend', true);
```

### Feature Flags
```javascript
// Disable network scanning
configManager.set('features.networkScanning', false);

// Enable offline mode
configManager.set('features.offlineMode', true);
```

## 📊 Monitoring

### Error Tracking
- Errors logged to error handler
- Can be reported to backend
- User-friendly messages shown
- Error history maintained

### Performance Monitoring
- API response times
- Data sync status
- Cache hit rates
- Render performance

## 🚀 Extensibility

### Adding New Features
1. Create new core module if needed
2. Integrate with data manager
3. Add validation rules
4. Update error handling
5. Add configuration options

### Backend Integration
1. Update API endpoints in `api.js`
2. Enable backend mode in config
3. Test sync functionality
4. Handle offline scenarios
5. Implement error recovery

---

**Core systems provide a solid foundation for scalable, maintainable applications!**

