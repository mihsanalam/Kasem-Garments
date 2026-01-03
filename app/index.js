import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mS } from '@/style/responsive';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, checkIfAdminExists } from '../config/auth';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');

        // Add a timeout for the entire initialization process
        const initPromise = async () => {
          try {
            // Step 1: Check if user is already logged in
            console.log('Checking for existing user data...');
            let userData;
            try {
              userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
              console.log('User data check result:', userData ? 'Found' : 'Not found');
            } catch (secureStoreError) {
              console.error('Error accessing SecureStore:', secureStoreError);
              // If we can't access secure store, treat as not logged in
              userData = null;
            }

            if (userData) {
              console.log('User is logged in, navigating to Home');
              setTimeout(() => router.replace('/(tabs)/Home'), 300);
              return;
            }

            // Step 2: If not logged in, check if any admin exists
            console.log('No user data found, checking if admin exists...');
            let hasAdmin = false;

            try {
              // Add timeout for Firebase operation
              const adminCheckPromise = checkIfAdminExists();
              const adminCheckTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Admin check timed out')), 5000)
              );

              hasAdmin = await Promise.race([adminCheckPromise, adminCheckTimeout]);
              console.log('Admin check result:', hasAdmin ? 'Admin exists' : 'No admin');
            } catch (adminCheckError) {
              console.error('Error checking if admin exists:', adminCheckError);
              // Default to assuming no admin if check fails
              hasAdmin = false;
            }

            // Step 3: Navigate based on admin check
            if (hasAdmin) {
              console.log('Admin exists, navigating to signin page');
              setTimeout(() => router.replace('/(auth)/signin'), 300);
            } else {
              console.log('No admin exists, navigating to signup page');
              setTimeout(() => router.replace('/(auth)/signup'), 300);
            }
          } catch (innerError) {
            console.error('Inner initialization error:', innerError);
            // Default to signin page on any error
            setTimeout(() => router.replace('/(auth)/signin'), 300);
          }
        };

        // Set a timeout for the entire initialization process
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('App initialization timed out')), 8000)
        );

        await Promise.race([initPromise(), timeoutPromise]);
      } catch (error) {
        console.error('Initialization failed or timed out:', error);
        // Ensure we navigate somewhere even if everything fails
        setTimeout(() => router.replace('/(auth)/signin'), 300);
      }
    };

    // Add a small delay to ensure splash screen is visible
    console.log('Setting up initialization with delay...');
    const timer = setTimeout(() => {
      initializeApp();
    }, 1500);

    return () => {
      console.log('Cleaning up initialization timer');
      clearTimeout(timer);
    };
  }, []);

  // Splash screen UI that will show while checking auth state
  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ক</Text>
        </View>
        <Text style={styles.appName}>মেসার্স কাশেম গার্মেন্টস</Text>
      </SafeAreaView>
      <StatusBar backgroundColor="white" style='light' />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    width: mS(100),
    height: mS(100),
    borderRadius: 10,
    backgroundColor: "#4caf50",
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: "white",
    fontSize: mS(65),
    fontWeight: 'bold',
  },
  appName: {
    marginTop: mS(20),
    fontSize: mS(25),
    fontWeight: 'bold',
  }
});
