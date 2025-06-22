# PharmaGuide Setup Guide

## Environment Configuration

### 1. Environment Variables Setup

The app now uses secure environment variables instead of hardcoded credentials. Follow these steps:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values:**
   ```bash
   # Required - Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # Optional - AI Service Configuration
   EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_huggingface_key_here
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_key_here
   
   # Environment
   EXPO_PUBLIC_ENVIRONMENT=development
   ```

3. **Never commit `.env` to version control** - it's already in `.gitignore`

### 2. Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anonymous key |
| `EXPO_PUBLIC_HUGGINGFACE_API_KEY` | ❌ No | HuggingFace API key for AI features |
| `EXPO_PUBLIC_GROQ_API_KEY` | ❌ No | Groq API key for enhanced AI chat |
| `EXPO_PUBLIC_ENVIRONMENT` | ❌ No | Environment (development/staging/production) |

### 3. Getting API Keys

#### Supabase (Required)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing
3. Go to Settings > API
4. Copy the Project URL and anon/public key

#### HuggingFace (Optional)
1. Go to [huggingface.co](https://huggingface.co)
2. Create account and go to Settings > Access Tokens
3. Create a new token with read permissions

#### Groq (Optional)
1. Go to [console.groq.com](https://console.groq.com)
2. Create account and generate API key

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
# or
expo start
```

### 3. Run on Device/Simulator
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## Environment-Specific Configuration

The app automatically detects the environment and adjusts settings:

- **Development**: Full logging, longer timeouts, debug features
- **Staging**: Reduced logging, production-like settings
- **Production**: Minimal logging, optimized performance

## Security Notes

1. **Never commit sensitive data** to version control
2. **Use different API keys** for different environments
3. **Rotate API keys regularly** in production
4. **Monitor API usage** to detect unauthorized access

## Troubleshooting

### App won't start
1. Check that `.env` file exists and has required variables
2. Verify Supabase URL format is correct
3. Check console for configuration errors

### AI features not working
1. Verify API keys are set correctly
2. Check API key permissions and quotas
3. AI features gracefully fallback to rule-based responses

### Environment variables not loading
1. Ensure variables start with `EXPO_PUBLIC_`
2. Restart the development server after changing `.env`
3. Clear Expo cache: `expo start --clear`

## Next Steps

After completing the environment setup:
1. Set up ESLint and Prettier (next task)
2. Add error boundaries
3. Set up testing infrastructure
4. Configure monitoring and analytics
