import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../../components/common/InputField';
import CustomButton from '@/components/common/CustomButton';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, checkIfAdminExists, USER_ROLES } from '../../config/auth';
import { mS } from '@/style/responsive';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SignIn = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
        if (userData) {
          router.replace('(tabs)/Home');
          return;
        }

        // Check if any admin exists in Firestore
        const hasAdmin = await checkIfAdminExists();

        // If no admin exists in Firestore, redirect to create admin account
        if (!hasAdmin) {
          console.log('No admin found in Firestore, redirecting to create admin account');
          setAdminExists(false);
          setIsLoading(false);
          return;
        }

        // If we have admins, just show the login screen
        setAdminExists(hasAdmin);
        setIsLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleCreateAdmin = async () => {
    try {
      if (!form.email || !form.password) {
        Alert.alert("ত্রুটি", "সব তথ্য পূরণ করুন");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        Alert.alert("ভুল ইমেইল ফরম্যাট", "দয়া করে একটি বৈধ ইমেইল ঠিকানা দিন");
        return;
      }

      // Validate password strength
      if (form.password.length < 6) {
        Alert.alert("দুর্বল পাসওয়ার্ড", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
        return;
      }

      console.log('Creating admin account with email:', form.email);

      // Step 1: Create Firebase Auth user
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        console.log('Admin user created successfully in Firebase Auth');
      } catch (authError) {
        console.error('Firebase Auth error creating admin:', authError);
        throw authError; // Re-throw to be caught by outer catch
      }

      const user = userCredential.user;

      // Step 2: Get FCM token (with error handling)
      let fcmToken = null;
      try {
        console.log('Attempting to get FCM token for admin user');
        const { notificationService } = require('../../service/api/notification');
        fcmToken = await notificationService.getFCMToken();
        console.log('FCM token obtained:', fcmToken ? 'Success' : 'Failed');
      } catch (tokenError) {
        // Don't fail the signup if token acquisition fails
        console.error('Error getting FCM token for admin:', tokenError);
      }

      // Step 3: Create user document in Firestore
      const userData = {
        email: user.email,
        role: USER_ROLES.ADMIN,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        fcmToken: fcmToken
      };

      try {
        await setDoc(doc(db, "users", user.uid), userData);
        console.log('Admin user document created successfully in Firestore');
      } catch (firestoreError) {
        console.error('Firestore error creating admin document:', firestoreError);
        // Continue anyway - we've already created the auth user
      }

      // Step 4: Store user data in SecureStore and navigate
      const userDataToStore = {
        email: user.email,
        role: USER_ROLES.ADMIN,
        uid: user.uid
      };

      try {
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_DATA, JSON.stringify(userDataToStore));
        console.log('Admin user data stored in SecureStore');

        // Use setTimeout to ensure all async operations complete before navigation
        setTimeout(() => {
          console.log('Navigating to Home screen after admin creation');
          router.replace('/(tabs)/Home');
        }, 500);
      } catch (storageError) {
        console.error('SecureStore error storing admin data:', storageError);
        Alert.alert(
          "সতর্কতা",
          "অ্যাকাউন্ট তৈরি হয়েছে কিন্তু লগইন তথ্য সংরক্ষণে সমস্যা হয়েছে। আবার লগইন করুন।",
          [{ text: 'ঠিক আছে', onPress: () => router.replace('/(auth)/signin') }]
        );
      }
    } catch (error) {
      console.error('Admin creation error:', error);

      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("ইমেইল ইতিমধ্যে ব্যবহৃত", "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। অন্য ইমেইল ব্যবহার করুন।");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("ভুল ইমেইল ফরম্যাট", "দয়া করে একটি বৈধ ইমেইল ঠিকানা দিন");
      } else if (error.code === 'auth/weak-password') {
        Alert.alert("দুর্বল পাসওয়ার্ড", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert("নেটওয়ার্ক সমস্যা", "ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন");
      } else {
        // Show more detailed error for debugging
        Alert.alert(
          "ত্রুটি",
          `অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন। (${error.code || 'unknown'}: ${error.message || 'No message'})`
        );
      }
    }
  };

  const handleSignIn = async () => {
    try {
      if (!form.email || !form.password) {
        Alert.alert("ত্রুটি", "সব তথ্য পূরণ করুন");
        return;
      }

      // Validate email format before checking with Firebase
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        Alert.alert("ভুল ইমেইল ফরম্যাট", "দয়া করে একটি বৈধ ইমেইল ঠিকানা দিন");
        return;
      }

      console.log('Attempting to sign in with email:', form.email);

      // Step 1: Sign in with Firebase Auth
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        console.log('Sign in successful with Firebase Auth');
      } catch (authError) {
        console.error('Firebase Auth sign in error:', authError);
        throw authError; // Re-throw to be caught by outer catch
      }

      const user = userCredential.user;

      // Step 2: Get user data from Firestore
      console.log('Getting user data from Firestore for UID:', user.uid);
      let userData;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log('No user document found in Firestore. Creating one...');
          // Create a user document if it doesn't exist
          const newUserData = {
            email: user.email,
            role: USER_ROLES.ADMIN, // Default to admin for existing auth users
            createdAt: new Date().toISOString(),
            createdBy: 'system-recovery'
          };

          await setDoc(userDocRef, newUserData);
          userData = newUserData;
          console.log('Created user document:', userData);
        } else {
          console.log('User document found in Firestore');
          userData = userDoc.data();
        }
      } catch (firestoreError) {
        console.error('Firestore error getting/creating user document:', firestoreError);
        // Create a minimal userData object to continue
        userData = {
          email: user.email,
          role: USER_ROLES.ADMIN, // Default to admin if we can't get the role
        };
      }

      // Step 3: Get FCM token (with error handling)
      let fcmToken = null;
      try {
        console.log('Attempting to get FCM token');
        const { notificationService } = require('../../service/api/notification');
        fcmToken = await notificationService.getFCMToken();
        console.log('FCM token obtained:', fcmToken ? 'Success' : 'Failed');

        // Update the token in Firestore if we got one
        if (fcmToken) {
          try {
            await notificationService.updateUserToken(user.uid, fcmToken);
            console.log('FCM token updated in Firestore');
          } catch (tokenUpdateError) {
            console.error('Error updating FCM token in Firestore:', tokenUpdateError);
            // Continue anyway
          }
        }
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        // Continue without token
      }

      // Step 4: Store user data in SecureStore and navigate
      const userDataToStore = {
        email: user.email,
        role: userData?.role || USER_ROLES.ADMIN, // Fallback to ADMIN if role is missing
        uid: user.uid,
        fcmToken: fcmToken
      };

      try {
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_DATA, JSON.stringify(userDataToStore));
        console.log('User data stored in SecureStore');

        // Use setTimeout to ensure all async operations complete before navigation
        setTimeout(() => {
          console.log('Navigating to Home screen after signin');
          router.replace('/(tabs)/Home');
        }, 500);
      } catch (storageError) {
        console.error('SecureStore error:', storageError);
        // Try to navigate anyway
        setTimeout(() => router.replace('/(tabs)/Home'), 500);
      }
    } catch (error) {
      console.error('Sign in error:', error);

      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          "অ্যাকাউন্ট পাওয়া যায়নি",
          "এই ইমেইল দিয়ে কোন অ্যাকাউন্ট নেই। দয়া করে সঠিক ইমেইল দিন বা নতুন অ্যাকাউন্ট তৈরি করুন।",
          [
            {
              text: "ঠিক আছে",
              onPress: () => {
                // If no admin exists, redirect to create admin account
                if (!adminExists) {
                  handleCreateAdmin();
                }
              }
            }
          ]
        );
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert("ভুল পাসওয়ার্ড", "আপনার দেওয়া পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।");
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert("ভুল ইমেইল", "আপনার দেওয়া ইমেইল সঠিক নয়। আবার চেষ্টা করুন।");
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert("অনেক বেশি চেষ্টা", "অনেক বেশি ভুল চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      } else if (error.code === 'auth/network-request-failed') {
        Alert.alert("নেটওয়ার্ক সমস্যা", "ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন");
      } else {
        // Show more detailed error for debugging
        Alert.alert(
          "ত্রুটি",
          `লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন। (${error.code || 'unknown'}: ${error.message || 'No message'})`
        );
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>ক</Text>
          </View>
          <Text style={styles.appName}>মেসার্স কাশেম গার্মেন্টস</Text>
          <Text style={[styles.appName, { fontSize: mS(14), marginTop: mS(0), color: 'gray', fontWeight: mS(100), }]}>
            {adminExists
              ? 'আপনাকে দোকানের হিসাব নিয়ন্ত্রণ অ্যাপ এ স্বাগতম'
              : 'কোন অ্যাকাউন্ট পাওয়া যায়নি। প্রথমে একটি এডমিন অ্যাকাউন্ট তৈরি করুন'}
          </Text>
          <View style={styles.inputContainer}>
            <InputField
              iconName="envelope"
              title="আপনার ইমেইল ঠিকানা লিখুন"
              placeholder="যেমন: example@email.com"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              keyboardType="email-address"
            />
            <InputField
              iconName="lock"
              title="আপনার পাসওয়ার্ড লিখুন"
              placeholder="**** **** ****"
              value={form.password}
              handleChangeText={(e) => setForm({ ...form, password: e })}
              secureTextEntry={true}
            />
          </View>
          <CustomButton
            title={adminExists ? "লগইন করুন" : "এডমিন অ্যাকাউন্ট তৈরি করুন"}
            onPress={adminExists ? handleSignIn : handleCreateAdmin}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: mS(1),
    paddingBottom: mS(20),
  },
  container: {
    marginLeft: mS(-10),
  },
  logoContainer: {
    marginTop: mS(30),
    marginLeft: mS(10),
    width: mS(45),
    height: mS(45),
    borderRadius: 10,
    backgroundColor: "#4caf50",
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: "white",
    fontSize: mS(28),
    fontWeight: 'bold',
  },
  appName: {
    marginLeft: mS(10),
    marginTop: mS(10),
    fontSize: mS(22),
    fontWeight: 'bold',
  },
  inputContainer: {
    marginLeft: mS(10),
    marginTop: mS(20),
    width: "100%",
  },
  forgotPass: {
    marginLeft: mS(10),
    color: '#4caf50',
    fontSize: mS(15),
    marginTop: mS(10),
  },
});

export default SignIn;
