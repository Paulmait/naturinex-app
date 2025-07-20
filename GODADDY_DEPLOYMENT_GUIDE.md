# GoDaddy Frontend Deployment Guide

## Prerequisites
- React app already built (✓ Completed)
- GoDaddy hosting account with File Manager access
- FTP credentials (if using FTP method)

## Method 1: Using GoDaddy File Manager (Workbench/cPanel)

1. **Log into GoDaddy Account**
   - Go to your GoDaddy account dashboard
   - Navigate to "My Products" > Your hosting plan
   - Click "Manage" or "cPanel Admin"

2. **Access File Manager**
   - In cPanel/Workbench, find "File Manager"
   - Navigate to `public_html` directory (this is your website root)

3. **Upload Build Files**
   - Delete any existing default files in `public_html`
   - Click "Upload" button
   - Upload all files from `client/build/` directory:
     - `index.html`
     - `asset-manifest.json`
     - `manifest.json`
     - `robots.txt`
     - `.htaccess` (IMPORTANT for React Router)
     - `static/` folder (contains JS, CSS files)
     - `locales/` folder
     - All other build files

4. **Verify .htaccess Upload**
   - Make sure `.htaccess` file is uploaded (it might be hidden)
   - This file is crucial for React Router to work properly

## Method 2: Using FTP Client (FileZilla)

1. **Get FTP Credentials**
   - In GoDaddy cPanel, find "FTP Accounts"
   - Note your FTP server, username, and password

2. **Connect via FTP**
   - Download FileZilla or similar FTP client
   - Connect using:
     - Host: ftp.yourdomain.com
     - Username: Your FTP username
     - Password: Your FTP password
     - Port: 21

3. **Upload Files**
   - Navigate to `/public_html` on remote server
   - Upload all contents of `client/build/` directory
   - Ensure all files transfer successfully

## Method 3: Using GoDaddy Website Builder (if applicable)

If you're using GoDaddy's Website Builder (not traditional hosting):

1. **Note**: Website Builder is for drag-and-drop sites only
2. **You'll need to migrate to GoDaddy Web Hosting** for React apps
3. Consider upgrading to:
   - Economy Linux Hosting (supports React apps)
   - Deluxe or Ultimate plans for better performance

## Post-Deployment Steps

1. **Update Environment Variables**
   - Your app is already configured to use production API URL
   - Backend URL: https://naturinex-app.onrender.com

2. **Test Your Deployment**
   - Visit your domain: https://yourdomain.com
   - Test all features:
     - User registration/login
     - Medication scanning
     - Premium features
     - Payment flow

3. **Update Stripe Webhook** (if using custom domain)
   - Go to Stripe Dashboard
   - Update webhook URL if needed

## Troubleshooting

### React Router Not Working (404 errors)
- Ensure `.htaccess` file is uploaded
- Check file permissions (should be 644)

### API Calls Failing
- Verify CORS settings on backend
- Check browser console for errors
- Ensure HTTPS is enabled

### Blank Page
- Check browser console for errors
- Verify all static files uploaded
- Clear browser cache

### Performance Issues
- Enable GoDaddy CDN if available
- Consider upgrading hosting plan
- Optimize images and assets

## Important Notes

1. **SSL Certificate**: Ensure HTTPS is enabled (GoDaddy provides free SSL)
2. **Domain Configuration**: Update DNS if using custom domain
3. **Backup**: Keep local backup of your build files
4. **Updates**: For future updates, just replace files in public_html

## Quick Checklist
- [ ] All build files uploaded
- [ ] .htaccess file present
- [ ] SSL/HTTPS enabled
- [ ] Domain pointing correctly
- [ ] All features tested
- [ ] Stripe webhooks working