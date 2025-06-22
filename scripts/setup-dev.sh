#!/bin/bash

# PharmaGuide Development Setup Script
echo "🚀 Setting up PharmaGuide development environment..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your actual values."
    echo "   Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
else
    echo "✅ .env file already exists"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
else
    echo "✅ Dependencies already installed"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Run linting (allow warnings)
echo "🔧 Running ESLint check..."
npm run lint -- --max-warnings 200

# Check formatting
echo "💅 Checking code formatting..."
npm run format:check || echo "⚠️  Some files need formatting. Run 'npm run format' to fix."

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your actual Supabase credentials"
echo "2. Run 'npm start' to start the development server"
echo "3. Run 'npm run format' to format all files"
echo "4. Run 'npm run lint:fix' to auto-fix linting issues"
echo "5. Run 'npm test' to run the test suite"
echo "6. Run 'npm run test:all' to run all quality checks and tests"
echo ""
echo "Available commands:"
echo "  npm start              - Start development server"
echo "  npm test               - Run tests"
echo "  npm run test:watch     - Run tests in watch mode"
echo "  npm run test:coverage  - Run tests with coverage report"
echo "  npm run lint           - Check code style"
echo "  npm run format         - Format code"
echo "  npm run type-check     - Check TypeScript types"
echo "  npm run code-quality   - Run all quality checks"
echo ""
echo "VS Code users: Install the ESLint and Prettier extensions for the best experience."
