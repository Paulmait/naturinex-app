// Mock for expo-store-review
const StoreReview = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(true),
  storeUrl: 'mock-store-url',
  hasAction: jest.fn().mockResolvedValue(true),
};

export default StoreReview; 