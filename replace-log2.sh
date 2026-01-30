#!/bin/bash

# Replace all log2 references with logto
echo "Replacing log2 with logto..."

# Update source files
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.html" \) -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/log2/logto/g' {} \;

# Update .env file
if [ -f .env ]; then
    sed -i 's/LOG2_/LOGTO_/g' .env
    sed -i 's/log2/logto/g' .env
fi

# Update public/index.html (already fixed earlier but let's make sure)
if [ -f public/index.html ]; then
    sed -i 's/log2/logto/g' public/index.html
fi

echo "Replacement complete!"