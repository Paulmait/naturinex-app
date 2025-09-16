# NaturineX App - Comprehensive Error Handling and Offline Support

This document outlines the comprehensive error handling and offline support system implemented for the NaturineX app. The system provides robust error recovery, detailed logging, offline functionality, and performance monitoring.

## Table of Contents

- [Overview](#overview)
- [Error Handling System](#error-handling-system)
- [Offline Support](#offline-support)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Implementation Guide](#implementation-guide)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)

## Overview

The NaturineX app now includes a comprehensive system for:

1. **Error Boundary Management** - Catches and handles React errors gracefully
2. **Centralized Error Logging** - Tracks, categorizes, and reports all errors
3. **Offline Service** - Maintains app functionality when network is unavailable
4. **Performance Monitoring** - Tracks app performance and user behavior
5. **Recovery Strategies** - Provides automated and manual error recovery options

## Error Handling System

### Components

#### 1. ErrorBoundary Component (`src/components/ErrorBoundary.js`)

Enhanced React error boundary with:
- **Error Categorization**: Network, Auth, Validation, Permission, Camera, Storage, API, Unknown
- **Severity Assessment**: Low, Medium, High, Critical
- **User-Friendly Messages**: Category-specific error messages
- **Recovery Options**: Context-aware recovery suggestions
- **Logging Integration**: Automatic logging to local storage and Supabase
- **Analytics Tracking**: Error analytics for monitoring

**Usage:**
```jsx
import ErrorBoundary from './src/components/ErrorBoundary';

<ErrorBoundary
  context="scanInterface"
  onRestart={handleRestart}
  onAuthReset={handleAuthReset}
  enableAnalytics={true}
>
  <YourComponent />
</ErrorBoundary>
```

#### 2. ErrorService (`src/services/ErrorService.js`)

Centralized error handling service providing:
- **Error Processing**: Automatic categorization and severity assessment
- **Local Logging**: AsyncStorage-based error logs (last 100 errors)
- **Remote Logging**: Supabase integration for error tracking
- **Retry Logic**: Exponential backoff retry mechanism
- **Performance Tracking**: Error-related performance metrics

**Usage:**
```javascript
import ErrorService from './src/services/ErrorService';

// Log an error
await ErrorService.logError(error, 'ComponentName.methodName', {
  additionalData: 'context'
});

// Log info/warning
await ErrorService.logInfo('Operation completed');
await ErrorService.logWarning('Performance threshold exceeded');

// Retry operation
const result = await ErrorService.retryOperation(
  async () => await apiCall(),
  3, // max retries
  1000 // initial delay
);
```

#### 3. Higher-Order Component Wrapper (`src/utils/withErrorBoundary.js`)

Utility for wrapping components with error boundaries:

```javascript
import withErrorBoundary, {
  withCriticalErrorBoundary,
  withUIErrorBoundary,
  withScreenErrorBoundary
} from './src/utils/withErrorBoundary';

// Wrap any component
const SafeComponent = withErrorBoundary(YourComponent, {
  context: 'custom-context',
  enableAnalytics: true
});

// Use pre-configured wrappers
const CriticalComponent = withCriticalErrorBoundary(ImportantComponent);
const UIComponent = withUIErrorBoundary(LayoutComponent);
const ScreenComponent = withScreenErrorBoundary(ScreenComponent);
```

## Offline Support

### Components

#### 1. OfflineServiceV2 (`src/services/OfflineServiceV2.js`)

Enhanced offline service with cross-platform support:

**Features:**
- **Network Detection**: Real-time network status monitoring
- **Operation Queueing**: Queue API calls when offline
- **Data Synchronization**: Automatic sync when connection restored
- **Local Caching**: Medication database and user data caching
- **Scan Storage**: Offline scan storage and processing
- **Retry Logic**: Intelligent retry with exponential backoff

**Usage:**
```javascript
import OfflineServiceV2 from './src/services/OfflineServiceV2';

// Listen for network changes
const unsubscribe = OfflineServiceV2.addNetworkListener((networkInfo) => {
  console.log('Network status:', networkInfo.isOnline);
});

// Queue operation for offline sync
await OfflineServiceV2.queueOperation({
  type: 'scan_upload',
  data: scanData,
  priority: 'high'
});

// Search medications offline
const results = await OfflineServiceV2.searchMedicationsOffline('aspirin');

// Get natural alternatives offline
const alternatives = await OfflineServiceV2.getNaturalAlternativesOffline('ibuprofen');

// Save scan for offline processing
const scan = await OfflineServiceV2.saveScanOffline(scanData);
```

#### 2. OfflineIndicator Component (`src/components/OfflineIndicator.js`)

UI component showing network status and offline information:

**Features:**
- **Status Display**: Visual network status indicator
- **Sync Information**: Shows pending operations and sync status
- **Offline Features**: Lists available offline functionality
- **Manual Sync**: Force sync when online
- **Tips and Help**: User guidance for offline mode

**Usage:**
```jsx
import OfflineIndicator from './src/components/OfflineIndicator';

// In your header/navigation
<OfflineIndicator style={{ marginRight: 15 }} />
```

### Offline Features Available

1. **Medication Database**: Cached locally for offline search
2. **Scan History**: Stored locally, accessible offline
3. **Natural Alternatives**: Offline suggestions for common medications
4. **User Preferences**: Cached for offline access
5. **Pending Operations**: Queued for sync when online

## Monitoring and Analytics

### MonitoringService (`src/services/MonitoringService.js`)

Comprehensive monitoring and analytics service:

**Features:**
- **Performance Tracking**: App startup, API response times, memory usage
- **User Behavior**: Screen views, user actions, session tracking
- **Error Analytics**: Error frequency, categorization, resolution tracking
- **Crash Reporting**: Detailed crash reports with context
- **Custom Metrics**: Track custom application metrics
- **Real-time Dashboard**: Live monitoring data

**Usage:**
```javascript
import MonitoringService from './src/services/MonitoringService';

// Track screen view
await MonitoringService.trackScreenView('HomeScreen');

// Track user action
await MonitoringService.trackUserAction('button_click', 'scan_medication');

// Track API performance
await MonitoringService.trackAPICall('/api/analyze', 'POST', 1250, 200);

// Track custom metric
await MonitoringService.trackCustomMetric('scan_accuracy', 0.95, {
  algorithm: 'v2',
  confidence: 'high'
});

// Record crash
await MonitoringService.recordCrash(error, errorInfo);

// Get analytics dashboard
const dashboard = await MonitoringService.getAnalyticsDashboard();
```

## Implementation Guide

### 1. Basic Setup

The system is automatically initialized in `App.js`:

```jsx
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineIndicator from './src/components/OfflineIndicator';

export default function App() {
  return (
    <ErrorBoundary context="root" enableAnalytics={true}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerRight: () => <OfflineIndicator />
          }}
        >
          {/* Your screens */}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
```

### 2. Component Integration

For critical components, wrap with error boundaries:

```jsx
import { withCriticalErrorBoundary } from './src/utils/withErrorBoundary';
import ErrorService from './src/services/ErrorService';
import OfflineServiceV2 from './src/services/OfflineServiceV2';

const MyComponent = () => {
  const handleApiCall = async () => {
    try {
      const result = await OfflineServiceV2.executeOperation({
        type: 'api_call',
        data: { /* request data */ }
      });
      return result;
    } catch (error) {
      await ErrorService.logError(error, 'MyComponent.handleApiCall');
      throw error;
    }
  };

  return (
    <View>
      {/* Component content */}
    </View>
  );
};

export default withCriticalErrorBoundary(MyComponent);
```

### 3. Offline-First Development

Design components to work offline:

```jsx
const ScanComponent = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = OfflineServiceV2.addNetworkListener((info) => {
      setIsOffline(!info.isOnline);
    });
    return unsubscribe;
  }, []);

  const handleScan = async (medicationName) => {
    try {
      let results;

      if (isOffline) {
        // Use offline service
        results = await OfflineServiceV2.getNaturalAlternativesOffline(medicationName);
      } else {
        // Use online API with offline fallback
        results = await OfflineServiceV2.executeOperation({
          type: 'medication_search',
          data: { medicationName }
        });
      }

      return results;
    } catch (error) {
      await ErrorService.logError(error, 'ScanComponent.handleScan');
      throw error;
    }
  };

  return (
    <View>
      {isOffline && (
        <Text>Offline mode - using cached data</Text>
      )}
      {/* Component content */}
    </View>
  );
};
```

## Database Schema

The system uses Supabase with the following tables:

### Core Tables

1. **error_logs**: Comprehensive error logging
2. **analytics_events**: User interaction tracking
3. **user_sessions**: Session tracking and analytics
4. **crash_reports**: Detailed crash information
5. **performance_metrics**: Performance monitoring data
6. **offline_sync_queue**: Offline operation queueing
7. **feature_usage**: Feature usage analytics
8. **app_health_metrics**: System-wide health metrics

### Setup Database

Run the SQL migration script:

```bash
# Using Supabase CLI
supabase db reset --linked
supabase db push

# Or execute the SQL file directly
psql -h your-db-host -U postgres -d your-db -f database/error_monitoring_schema.sql
```

## API Reference

### ErrorService Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `logError(error, context, additionalData)` | Log an error with context | error, context string, additional data object |
| `logInfo(message, data)` | Log info message | message string, data object |
| `logWarning(message, data)` | Log warning message | message string, data object |
| `retryOperation(operation, maxRetries, initialDelay)` | Retry operation with backoff | async function, retry count, delay |
| `getErrorStats()` | Get error statistics | none |
| `getRecentErrors(limit)` | Get recent errors | limit number |
| `clearErrorData()` | Clear all error data | none |

### OfflineServiceV2 Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `addNetworkListener(callback)` | Listen for network changes | callback function |
| `queueOperation(operation)` | Queue operation for sync | operation object |
| `executeOperation(operation)` | Execute operation (online/offline) | operation object |
| `saveScanOffline(scanData)` | Save scan for offline processing | scan data object |
| `getScanHistory(limit)` | Get scan history | limit number |
| `searchMedicationsOffline(query)` | Search medications offline | search query |
| `getNaturalAlternativesOffline(medication)` | Get alternatives offline | medication name |
| `forceSyncNow()` | Force immediate sync | none |
| `getSyncStats()` | Get sync statistics | none |
| `clearOfflineData()` | Clear all offline data | none |

### MonitoringService Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `trackEvent(eventType, eventData)` | Track custom event | event type, data object |
| `trackScreenView(screenName, additionalData)` | Track screen view | screen name, additional data |
| `trackUserAction(action, element, additionalData)` | Track user action | action, element, additional data |
| `trackAPICall(endpoint, method, duration, status, error)` | Track API performance | endpoint, method, duration, status, error |
| `trackPerformanceMetric(metricName, value, metadata)` | Track performance metric | metric name, value, metadata |
| `trackCustomMetric(name, value, tags)` | Track custom metric | name, value, tags |
| `recordCrash(error, errorInfo)` | Record crash report | error object, error info |
| `getAnalyticsDashboard()` | Get analytics dashboard data | none |

## Best Practices

### Error Handling

1. **Always wrap critical components** with error boundaries
2. **Use appropriate error categories** for better tracking
3. **Provide meaningful context** when logging errors
4. **Don't over-log** - focus on actionable errors
5. **Test error scenarios** during development

### Offline Support

1. **Design offline-first** - assume network issues
2. **Cache critical data** proactively
3. **Queue operations** when offline
4. **Provide user feedback** about offline status
5. **Test offline scenarios** thoroughly

### Performance Monitoring

1. **Track key metrics** that impact user experience
2. **Set performance thresholds** and alerts
3. **Monitor error trends** for early detection
4. **Use analytics data** to improve app performance
5. **Regular review** of monitoring dashboards

### Security Considerations

1. **Sanitize sensitive data** before logging
2. **Use RLS policies** in Supabase for data access
3. **Encrypt offline data** when necessary
4. **Rotate API keys** regularly
5. **Monitor for security incidents** in error logs

## Troubleshooting

### Common Issues

1. **Network Detection Not Working**
   - Check NetInfo configuration
   - Verify platform-specific implementations
   - Test on actual devices

2. **Offline Data Not Syncing**
   - Check sync queue status
   - Verify network permissions
   - Review error logs for sync failures

3. **Error Boundary Not Catching Errors**
   - Ensure proper nesting
   - Check for async errors (not caught by boundaries)
   - Verify error boundary placement

4. **Performance Issues**
   - Review log storage limits
   - Check for memory leaks in monitoring
   - Optimize sync frequency

### Debug Mode

Enable debug logging in development:

```javascript
// In your app initialization
if (__DEV__) {
  ErrorService.enableDebugMode();
  OfflineServiceV2.enableDebugMode();
  MonitoringService.enableDebugMode();
}
```

## Support

For issues or questions about the error handling and offline support system:

1. Check the error logs in Supabase dashboard
2. Review the monitoring analytics
3. Test with different network conditions
4. Consult the troubleshooting section above

The system is designed to be self-monitoring and self-healing, providing comprehensive insights into app performance and user experience.