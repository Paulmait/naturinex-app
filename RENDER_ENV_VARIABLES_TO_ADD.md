# 🔧 Render Environment Variables to Add

## You Already Have ✅:
- GEMINI_API_KEY
- GOOGLE_VISION_API_KEY
- MONGODB_URI
- NODE_ENV
- PORT
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

## Need to Add 🆕:

### 1. FIREBASE_PROJECT_ID
```
Key: FIREBASE_PROJECT_ID
Value: naturinex-app
```

### 2. FIREBASE_CLIENT_EMAIL
```
Key: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-fbsvc@naturinex-app.iam.gserviceaccount.com
```

### 3. FIREBASE_PRIVATE_KEY
```
Key: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCU+o9A2n17v76Z\nwA8itWQNTRVxNjCHPJIci8DSAJdMukxl4LZs9R5mJ3D5r3oHR6JopJx9tUBDyt3z\nCUFfJFy5OxStQO+9Hb3jSy7kKJgd0h9ErLJiLRNnOBQHbaiCbhwArSkTvRo/X3Dx\nwrEy/8uvv2bSLkBJkoE9nmT7XWH7t/09hz4nSnsfzNRkoPor8OqVl5WfpY6H5NQx\nIvQ47U0gJ+toESL+SMGb+tcfqidj6FHjTYGaCqxHMS67lMNWLNM7croN2wFcQw7W\nP0r5//4t3Xkifq/yfqq8ricL26hKUtGZh3UdsrK455ENuQ1ZmiLdkVgX4oE5Iwvt\nk2RGdo8NAgMBAAECggEAE9RnCXubnMNouBfZm+XXh7K1MjDDlFiiXSTX+UvlV6vr\ne9sFhSq6TWAeGEn8XOgyzKlugAgGYg+oa89VUXfqVKhxx97fGkXRbuXku69QkhWU\nHmS7SLiVvtU2y0dUGOpVlVx3HX679ef7BV8EDZUBNGcuZTcNTQ2wYLaK2+9x2ZqP\nmcZ3rmLxt95NdIDhgLoH4oDh519GIfEKqBMBkEm8wXrKbAHatuI7zHoD8Wpcy9W/\n0VK7H2mCNPC2CB9Ax0WbtHs+T0kqspMPcqfw8At7t0PVnIexYKoBz37kM/lTmF5y\nmUZPTFWXEJi69448gi3LJnckaQgEnA8DmptnjHIymQKBgQDJejNetiIDLHiLcBeI\ny5VtCTXLtFWx2cL3q+c0o3/cE+4re5S3apfsVJFltokDaeCsIlCrVHRvB4afw1lv\nOOTiyJfk6fDMCU4onzTs1pPwiMMO3r+XintCn8lWazzVbTwOqy2zXQdUn10Y9TAF\nIecuQwNzADy79uPhTa8JJNxJmQKBgQC9S2ZRj8NfdW47l+ppfHxAv30xsIZlTFYJ\niP4K5M8sNVTzJbYs+RuR04xxBhqrsVndlYnG4e2su0jznp6+dZbLgXL1Sfa5qBlX\nD99/Hggrwx+gtuFD34oDny48JqOp9KkX2raBZecgyegoOE/czwgtK2bcIRAJ6duS\nuqBzOrshlQKBgDFK5nqLkPK51Jw4xmk/dcWBdVnrOvQSVPMHab+lKMkNTz3wNEhT\nmevGHPSHninpo4A5vQbN2Na5PqSjxKPDhaw+a3skCTfCJw8lNGula/hzXVWsBa/r\nv5BjS30LK40D9qeYFcxGPF7lxn8urZrz2n2lA5kFO9a45rPer65LCGIxAoGADXK9\n4i2Eg9Oj8Tfpv3TInxD7o/wWkDvMIQFKixuWXF2tm1iiiK9p9gJBiAYW/vuqlsN4\n9lg2un7Tv/sU7BMOk4au1B5dGPOIWVcXWcCYdAN4y8IyXtASzg8RCdT0664mFTvE\nm4zRztKJW9IkWlubCRp8REdVDF9A6ju4Cnexs8ECgYAIqYvaVop8LKAOggGWiRc9\nmj4Bf6OWryE9eatujc6lEP0/XVP7Da2tVQY/u01E0917Xm35pv0+UrNWK08GFrCQ\nj9f0usyWO9GwpjlI2LtetCEqiJf85cnA+XizztdRFPnIhF5mz3dLOCyoKTRJAVVO\nrIJCkTxsTLcBPSudw6Hy2A==\n-----END PRIVATE KEY-----\n
```

## Important Notes:

1. **Copy the FIREBASE_PRIVATE_KEY exactly as shown** - including all the `\n` characters
2. **Don't add quotes** around the values in Render
3. **Update MONGODB_URI** if it still has the old password

## Also Update (if needed):

### STRIPE_WEBHOOK_SECRET
Get from: Stripe Dashboard → Webhooks → Your endpoint → Signing secret
Should look like: `whsec_abcd1234...`

### GEMINI_API_KEY  
Get from: https://makersuite.google.com/app/apikey
Should look like: `AIzaSy...`

## After Adding:
1. Click "Save Changes"
2. Render will automatically redeploy
3. Check the logs to confirm Firebase initializes:
   ```
   ✅ Firebase Admin initialized with service account
   ```

That's it! Just add these 3 Firebase variables and your server will be fully configured.