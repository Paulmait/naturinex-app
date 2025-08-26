// Mock for expo-sharing
const Sharing = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue({ type: 'success' }),
  shareAsyncWithOptions: jest.fn().mockResolvedValue({ type: 'success' }),
};

export default Sharing; 