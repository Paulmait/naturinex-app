# Setting Up GitHub for Your Project

## Option 1: Create New GitHub Repository

1. Go to https://github.com and sign in
2. Click the "+" icon in top right → "New repository"
3. Name it: `mediscan-app` or `naturinex-app`
4. Keep it **Private** if you want
5. **Don't** initialize with README (you already have code)
6. Click "Create repository"

## Option 2: Add Remote to Your Local Repository

After creating the repository on GitHub, run these commands:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/mediscan-app.git

# Push your code
git push -u origin master
```

If you're using SSH instead of HTTPS:
```bash
git remote add origin git@github.com:YOUR_USERNAME/mediscan-app.git
git push -u origin master
```

## If You Already Have a GitHub Repo

Just share the repository URL and I'll help you connect it.

---

Once you've created the GitHub repository, let me know and I'll help you continue with the Render deployment!