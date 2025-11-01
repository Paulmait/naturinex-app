#!/bin/bash
# Script to remove .env.production from git history
# IMPORTANT: Make sure you have a backup before running this!

echo "🔒 Removing sensitive files from git history..."
echo ""

# Check if BFG is available
if command -v java &> /dev/null && [ -f "bfg.jar" ]; then
    echo "Using BFG Repo-Cleaner (faster method)..."
    java -jar bfg.jar --delete-files .env.production
    java -jar bfg.jar --delete-files .env.development
else
    echo "Using git filter-branch (slower method)..."
    git filter-branch --force --index-filter \
      "git rm --cached --ignore-unmatch .env.production .env.development" \
      --prune-empty --tag-name-filter cat -- --all
fi

echo ""
echo "Cleaning up..."
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Sensitive files removed from git history"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Review changes: git log --all --oneline"
echo "2. Force push to remote: git push origin --force --all"
echo "3. Force push tags: git push origin --force --tags"
echo "4. Notify team members to re-clone the repository"
