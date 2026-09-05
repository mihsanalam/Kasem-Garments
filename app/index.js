import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mS } from '@/style/responsive';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, checkIfAdminExists } from '../config/auth';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const [status, setStatus] = useState('অ্যাপ শুরু হচ্ছে...'); // App starting...
  const [error, setError] = useState(null);

  useEffect(() => {
    // MINIMAL TEST - just navigate immediately
    console.log('Minimal test: navigating to signin immediately');
    setStatus('নেভিগেট করা হচ্ছে...'); // Navigating...
    
    const timer = setTimeout(() => {
      console.log('Attempting navigation...');
      router.replace('/(auth)/signin');
    }, 2000);

    return () => {
      console.log('Cleaning up timer');
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
        <Text style={styles.status}>{status}</Text>
        {error && <Text style={styles.error}>{error}</Text>}
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
  },
  status: {
    marginTop: mS(30),
    fontSize: mS(14),
    color: '#666',
    textAlign: 'center',
  },
  error: {
    marginTop: mS(10),
    fontSize: mS(12),
    color: '#d32f2f',
    textAlign: 'center',
    paddingHorizontal: mS(20),
  },
});
