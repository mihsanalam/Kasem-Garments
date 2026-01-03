import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/common/InputField";
import CustomButton from "@/components/common/CustomButton";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS, USER_ROLES, checkIfAdminExists } from '../../config/auth';
import { mS } from '@/style/responsive';
import { notificationService } from '../../service/api/notification';

const SignUp = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    accountType: USER_ROLES.STAFF
  });
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
        if (userData) {
          const { role } = JSON.parse(userData);
          if (role !== USER_ROLES.ADMIN) {
            Alert.alert("অননুমোদিত", "শুধুমাত্র এডমিন এই পেজ দেখতে পারবেন");
            router.replace('/(tabs)/Home');
            return;
          }
        }

        // Check if any admin exists in Firestore
        const adminExists = await checkIfAdminExists();

        // If no admin exists, this is first-time setup
        if (!adminExists) {
          console.log('No admin found in Firestore, showing first-time setup screen');
          setIsFirstTimeSetup(true);
        } else {
          setIsFirstTimeSetup(false);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleSignUp = async () => {
    try {
      if (!form.email || !form.password) {
        Alert.alert("ত্রুটি", "সব তথ্য পূরণ করুন");
        return;
      }

      // Validate email format before creating account
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

      console.log('Attempting to create user with email:', form.email);

      // Step 1: Create Firebase Auth user
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        console.log('User created successfully in Firebase Auth');
      } catch (authError) {
        console.error('Firebase Auth error:', authError);
        throw authError; // Re-throw to be caught by outer catch
      }

      const user = userCredential.user;

      // If this is first-time setup, make the user an admin
      const role = isFirstTimeSetup ? USER_ROLES.ADMIN : form.accountType;
      const isAdmin = role === USER_ROLES.ADMIN;

      // Step 2: Get FCM token if admin (with error handling)
      let fcmToken = null;
      if (isAdmin) {
        try {
          console.log('Attempting to get FCM token for admin user');
          fcmToken = await notificationService.getFCMToken();
          console.log('FCM token obtained:', fcmToken ? 'Success' : 'Failed');
        } catch (tokenError) {
          // Don't fail the signup if token acquisition fails
          console.error('Error getting FCM token:', tokenError);
        }
      }

      // Step 3: Create user document in Firestore
      console.log('Creating user document in Firestore with role:', role);
      const userData = {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.email || 'system',
        fcmToken: fcmToken
      };

      try {
        await setDoc(doc(db, "users", user.uid), userData);
        console.log('User document created successfully in Firestore');
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Continue anyway - we've already created the auth user
      }

      // Step 4: Store user data in SecureStore and navigate
      if (isFirstTimeSetup) {
        const userDataToStore = {
          email: user.email,
          role: USER_ROLES.ADMIN,
          uid: user.uid
        };

        try {
          await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_DATA, JSON.stringify(userDataToStore));
          console.log('User data stored in SecureStore');

          // Use setTimeout to ensure all async operations complete before navigation
          setTimeout(() => {
            console.log('Navigating to Home screen');
            router.replace('/(tabs)/Home');
          }, 500);
        } catch (storageError) {
          console.error('SecureStore error:', storageError);
          Alert.alert(
            "সতর্কতা",
            "অ্যাকাউন্ট তৈরি হয়েছে কিন্তু লগইন তথ্য সংরক্ষণে সমস্যা হয়েছে। আবার লগইন করুন।",
            [{ text: 'ঠিক আছে', onPress: () => router.replace('/(auth)/signin') }]
          );
        }
      } else {
        Alert.alert("সফল", "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে", [
          {
            text: 'ঠিক আছে',
            onPress: () => {
              console.log('Navigating to Home screen after alert');
              setTimeout(() => router.replace('/(tabs)/Home'), 300);
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Signup error:', error);

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>লোড হচ্ছে...</Text>
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
          <Text style={styles.appName}>
            {isFirstTimeSetup ? 'এডমিন অ্যাকাউন্ট তৈরি করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </Text>
          <View style={styles.inputContainer}>
            <InputField
              iconName="envelope"
              title="ইমেইল ঠিকানা"
              placeholder="example@email.com"
              value={form.email}
              handleChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="email-address"
            />
            <InputField
              iconName="lock"
              title="পাসওয়ার্ড"
              placeholder="**** **** ****"
              value={form.password}
              handleChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry={true}
            />
            {!isFirstTimeSetup && (
              <View style={styles.roleContainer}>
                <Text style={styles.roleLabel}>অ্যাকাউন্টের ধরন</Text>
                <View style={styles.roleButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      form.accountType === USER_ROLES.STAFF && styles.roleButtonActive
                    ]}
                    onPress={() => setForm({ ...form, accountType: USER_ROLES.STAFF })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      form.accountType === USER_ROLES.STAFF && styles.roleButtonTextActive
                    ]}>স্টাফ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      form.accountType === USER_ROLES.ADMIN && styles.roleButtonActive
                    ]}
                    onPress={() => setForm({ ...form, accountType: USER_ROLES.ADMIN })}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      form.accountType === USER_ROLES.ADMIN && styles.roleButtonTextActive
                    ]}>এডমিন</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <CustomButton
            otherStyles={{ marginLeft: mS(-5)}}
            title={isFirstTimeSetup ? "এডমিন অ্যাকাউন্ট তৈরি করুন" : "অ্যাকাউন্ট তৈরি করুন"}
            onPress={handleSignUp}
          />
          {!isFirstTimeSetup && (
            <CustomButton
              otherStyles={{ marginLeft: mS(-5)}}
              title="লগইন পেজে ফিরে যান"
              onPress={() => router.replace('/(auth)/signin')}
              style={styles.secondaryButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: mS(1),
    paddingBottom: mS(20),
  },
  container: {
    paddingHorizontal: mS(20),
    width: "100%",
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logoContainer: {
    marginTop: mS(40),
    marginBottom: mS(10),
    width: mS(60),
    height: mS(60),
    borderRadius: 15,
    backgroundColor: "#4caf50",
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: "white",
    fontSize: mS(32),
    fontWeight: 'bold',
  },
  appName: {
    marginTop: mS(5),
    fontSize: mS(22),
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: mS(20),
  },
  inputContainer: {
    width: '100%',
    marginBottom: mS(20),
    marginLeft: mS(10),
  },
  roleContainer: {
    marginTop: mS(15),
  },
  roleLabel: {
    fontSize: mS(14),
    marginBottom: mS(8),
    color: '#333',
    fontWeight: '500',
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    gap: mS(5),
  },
  roleButton: {
    // flex: 1.5,
    paddingVertical: mS(12),
    paddingHorizontal: mS(62),
    borderRadius: mS(8),
    borderWidth: 1,
    borderColor: '#4caf50',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleButtonActive: {
    backgroundColor: '#4caf50',
  },
  roleButtonText: {
    fontSize: mS(14),
    color: '#4caf50',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: '#e0e0e0',
    marginTop: mS(10),
  },
});

export default SignUp;
