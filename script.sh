#!/bin/bash

# ---
# A script to scaffold a new full-stack project with backend and frontend directories.
#
# Usage: ./setup_project.sh MyAwesomeProject
# ---

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if a project name was provided.
if [ -z "$1" ]; then
  echo "Error: No project name provided."
  echo "Usage: $0 <ProjectName>"
  exit 1
fi

PROJECT_NAME="$1"

echo "Creating project structure for '$PROJECT_NAME'..."

# Create root project directory
mkdir "$PROJECT_NAME"
cd "$PROJECT_NAME"

# --- Create Backend Structure ---
echo "Setting up backend..."
mkdir -p backend/src/{api/{routes,controllers},config,middleware,models,services,utils}
touch backend/src/index.js # Or your main entry file (e.g., server.ts)
touch backend/.env
touch backend/.gitignore
touch backend/package.json

# --- Create Frontend Structure ---
echo "Setting up frontend..."
mkdir -p frontend/public/images
mkdir -p frontend/src/{assets/{fonts,styles},components,hooks,pages,services,utils}
touch frontend/public/index.html
touch frontend/src/index.js # Or main.jsx, etc.
touch frontend/.gitignore
touch frontend/package.json

# --- Create Root Files ---
touch README.md

# --- Populate Gitignore and Package.json Files ---
echo "Populating initial files..."

# Backend .gitignore
cat <<EOT >> backend/.gitignore
# Dependencies
/node_modules

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
/dist
/build
EOT

# Backend package.json
cat <<EOT >> backend/package.json
{
  "name": "${PROJECT_NAME}-backend",
  "version": "1.0.0",
  "description": "Backend for ${PROJECT_NAME}",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
EOT

# Frontend .gitignore
cat <<EOT >> frontend/.gitignore
# Dependencies
/node_modules

# Build output
/dist
/build

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
EOT

# Frontend package.json
cat <<EOT >> frontend/package.json
{
  "name": "${PROJECT_NAME}-frontend",
  "version": "1.0.0",
  "private": true,
  "description": "Frontend for ${PROJECT_NAME}",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
EOT

# Root README.md
echo "# $PROJECT_NAME" >> README.md

echo "Project '$PROJECT_NAME' created successfully!"
echo "Next steps:"
echo "  cd $PROJECT_NAME/backend && npm install"
echo "  cd ../frontend && npm install"

exit 0
