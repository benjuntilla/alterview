#!/bin/bash

# Create necessary directories
mkdir -p public/js/pdf/cmaps

# Copy PDF.js files from source to public directory
echo "Copying PDF.js files to public directory..."

# Copy main library files
cp -v build/pdf.mjs public/js/pdf/
cp -v build/pdf.worker.mjs public/js/pdf/

# Copy cMaps directory
cp -vr web/cmaps/* public/js/pdf/cmaps/

echo "PDF.js setup complete!"
echo "The following files have been installed:"
echo "- public/js/pdf/pdf.mjs"
echo "- public/js/pdf/pdf.worker.mjs"
echo "- public/js/pdf/cmaps/ (directory with character maps)"

echo ""
echo "You may now use PDF.js in your application!" 