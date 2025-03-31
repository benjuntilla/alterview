#!/bin/bash

# Vercel deployment script for hackathon

echo "Preparing for Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "Building project..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete!" 