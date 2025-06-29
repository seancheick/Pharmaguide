import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ErrorBoundary } from './ErrorBoundary';

interface ScreenErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const ScreenErrorFallback: React.FC<ScreenErrorFallbackProps> = ({ error, resetError }) => {
  const navigation = useNavigation();

  const handleGoHome = () => {
    resetError();
    navigation.navigate('Home' as never);
  };

  const handleGoBack = () => {
    resetError();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Screen Error</Text>
        <Text style={styles.message}>
          This screen encountered an error. You can try going back or return to the home screen.
        </Text>
        
        <Text style={styles.errorMessage}>
          {error.message}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={resetError}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGoBack}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGoHome}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
}

export const ScreenErrorBoundary: React.FC<ScreenErrorBoundaryProps> = ({ 
  children, 
  screenName 
}) => {
  const handleError = (error: Error) => {
    console.error(`Screen Error in ${screenName || 'Unknown Screen'}:`, error);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <ScreenErrorFallback 
          error={new Error(`Error in ${screenName || 'screen'}`)} 
          resetError={() => {}} 
        />
      }
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorMessage: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#007bff',
  },
});
