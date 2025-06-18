# PharmaGuide Agent Guide

## Commands
- **Start**: `npm start` or `expo start` - Start Expo development server
- **iOS**: `npm run ios` - Run on iOS simulator
- **Android**: `npm run android` - Run on Android emulator/device
- **Web**: `npm run web` - Run in web browser
- **TypeScript**: `npx tsc --noEmit` - Type check without emitting files

## Architecture
- **React Native/Expo** app for iOS/Android with TypeScript
- **Supabase** backend for auth, database, and API
- **Redux Toolkit** + **Zustand** for state management (dual approach)
- **React Navigation** for navigation (stack + bottom tabs)
- **Services**: AI analysis, product data, analytics, performance monitoring
- **Key directories**: `src/components`, `src/screens`, `src/services`, `src/stores`

## Code Style
- **TypeScript strict mode** enabled
- **Imports**: Absolute imports from `src/`, use barrel exports from `constants/`
- **Components**: Functional components with React.FC typing
- **Styling**: StyleSheet.create with consistent COLORS/SPACING/TYPOGRAPHY constants
- **Props**: Interface definitions for all component props
- **State**: Use hooks for local state, Redux/Zustand for global state
- **Async**: Use async/await pattern, handle errors with try/catch
- **Files**: PascalCase for components, camelCase for utilities
