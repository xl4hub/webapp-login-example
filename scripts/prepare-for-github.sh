#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Preparing Repository for GitHub ===${NC}"

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
fi

# Remove sensitive files if they exist
echo -e "\n${GREEN}Checking for sensitive files...${NC}"
SENSITIVE_FILES=(".env" "*.db" "*.sqlite" "oauth.db")

for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${YELLOW}Found $file - will not be committed${NC}"
    fi
done

# Check if .gitignore exists and is properly configured
if [ ! -f .gitignore ]; then
    echo -e "${RED}ERROR: .gitignore not found!${NC}"
    exit 1
fi

# Create example configuration if needed
if [ -f .env ] && [ ! -f config/.env.example ]; then
    echo -e "\n${GREEN}Creating .env.example from current .env...${NC}"
    sed -E 's/(SECRET|PASSWORD|KEY)=.*/\1=<change-this>/' .env > config/.env.example
fi

# Clean up any generated files
echo -e "\n${GREEN}Cleaning build artifacts...${NC}"
rm -rf dist/
rm -f *.log
rm -rf logs/*.log

# Create empty directories that should exist
echo -e "\n${GREEN}Creating directory structure...${NC}"
mkdir -p data logs auth-server/data scripts config docs public/js public/css src/routes

# Set executable permissions on scripts
echo -e "\n${GREEN}Setting script permissions...${NC}"
chmod +x scripts/*.sh

# Create a basic .env.example if it doesn't exist
if [ ! -f config/.env.example ]; then
    echo -e "${GREEN}Creating basic .env.example...${NC}"
    cat > config/.env.example << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=change-this-to-a-random-string

# OAuth2 Configuration
OAUTH_CLIENT_ID=webapp-client
OAUTH_CLIENT_SECRET=change-this-to-a-random-string
OAUTH_AUTH_URL=http://localhost:4000/oauth/authorize
OAUTH_TOKEN_URL=http://localhost:4000/oauth/token
OAUTH_USERINFO_URL=http://localhost:4000/oauth/userinfo
OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback
EOF
fi

# Git status
echo -e "\n${GREEN}Current git status:${NC}"
git status --short

# Suggestions
echo -e "\n${GREEN}✓ Repository prepared for GitHub!${NC}"
echo -e "\nNext steps:"
echo -e "1. Review the files that will be committed"
echo -e "2. ${YELLOW}git add .${NC}"
echo -e "3. ${YELLOW}git commit -m \"Initial commit\"${NC}"
echo -e "4. ${YELLOW}git remote add origin https://github.com/YOUR_USERNAME/webapp.git${NC}"
echo -e "5. ${YELLOW}git push -u origin main${NC}"

echo -e "\n${YELLOW}Remember:${NC}"
echo -e "- Change default passwords in documentation"
echo -e "- Update repository URL in README.md"
echo -e "- Update copyright in LICENSE and NOTICE files"
echo -e "- Configure GitHub repository settings (private/public)"