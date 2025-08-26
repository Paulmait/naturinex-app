// Mock for expo-image-picker
const ImagePicker = {
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'mock-camera-image-uri' }],
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'mock-library-image-uri' }],
  }),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
  ImagePickerResult: {
    canceled: false,
    assets: [{ uri: 'mock-image-uri' }],
  },
};

export default ImagePicker; 