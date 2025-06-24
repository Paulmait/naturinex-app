# Mediscan App

A full-stack application that helps users find natural alternatives to medications using AI-powered suggestions.

## Features

- 🔐 Google Authentication with Firebase
- 🤖 AI-powered natural alternative suggestions using Google Gemini
- 📊 Daily usage tracking (5 scans per day limit)
- 📧 Email results functionality
- 🎨 Clean, modern UI

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Firebase project
- Google Gemini API key

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication with Google provider
4. Enable Firestore Database
5. Copy your Firebase config from Project Settings

### 2. Google Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key for Gemini
3. Save the API key for later use

### 3. Server Setup

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the `.env` file with your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=5000
   ```

### 4. Client Setup

1. Navigate to client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update `src/firebase.js` with your actual Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

### 5. Running the Application

From the root directory, you can start both server and client:

```bash
npm start
```

Or run them separately:

**Server (Terminal 1):**
```bash
cd server
npm start
```

**Client (Terminal 2):**
```bash
cd client
npm start
```

The application will be available at:
- Client: http://localhost:3000
- Server: http://localhost:5000

## Usage

1. Sign in with your Google account
2. Enter a medication name (image upload is for future implementation)
3. Click "Get Natural Alternatives" to receive AI-powered suggestions
4. Email the results to yourself if needed
5. You can perform up to 5 scans per day

## Project Structure

```
mediscan-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   └── Login.js
│   │   ├── App.js
│   │   ├── firebase.js
│   │   └── index.js
│   └── package.json
├── server/                 # Express backend
│   ├── index.js
│   ├── package.json
│   └── .env
└── README.md
```

## Security Notes

- Never commit your `.env` file or API keys to version control
- The Firebase config in `firebase.js` contains public keys that are safe to expose
- Keep your Gemini API key secure and don't share it

## Future Enhancements

- [ ] Image processing for medication recognition
- [ ] Barcode scanning
- [ ] Enhanced UI/UX design
- [ ] User profile management
- [ ] Favorite alternatives tracking
- [ ] Advanced filtering options

## Troubleshooting

### Common Issues

1. **"AI service not configured properly"**
   - Check that your Gemini API key is correctly set in `server/.env`

2. **Firebase errors**
   - Verify your Firebase configuration in `client/src/firebase.js`
   - Ensure Authentication and Firestore are enabled in Firebase Console

3. **CORS errors**
   - Make sure the server is running on port 5000
   - Check that the client is making requests to the correct server URL

## Support

If you encounter any issues, please check:
1. All dependencies are installed (`npm install` in both client and server)
2. Environment variables are correctly set
3. Firebase project is properly configured
4. Both client and server are running

## License

MIT License
