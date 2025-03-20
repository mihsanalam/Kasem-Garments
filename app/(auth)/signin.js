import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../../components/common/InputField';
import CustomButton from '@/components/common/CustomButton';
import { rS, vS, mS } from '@/style/responsive';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const SignIn = () => {

  const [form, setForm] = useState({
    email: '',    // Email field for user login
    password: '',
  });

  const router = useRouter();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
      console.log('Logged in with :' + user.email);
      router.replace("(tabs)/Home");  // Redirect to Dashboard after login
    } catch (error) {
      alert(error.message);  // Show any error if login fails
    }
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
            আপনাকে দোকানের হিসাব নিয়ন্ত্রণ অ্যাপ এ স্বাগতম
          </Text>

          <View style={styles.inputContainer}>
            <InputField
              iconName="envelope"   
              title="আপনার ইমেইল ঠিকানা লিখুন"
              placeholder="যেমন: example@mail.com"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              keyboardType="email-address"   
            />

            <InputField
              iconName="lock"
              title="আপনার পাসওয়ার্ড লিখুন"
              placeholder="**** **** ****"
              value={form.password}
              handleChangeText={(e) => setForm({ ...form, password: e })}
              secureTextEntry={true}    // Secure text entry for password field
            />
          </View>

          <Text style={styles.forgotPass}>পাসওয়ার্ড ভুলে গেছেন?</Text>

          <CustomButton
            title="লগইন করুন"
            onPress={handleLogin}   // Handle login on button press
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
    marginLeft: mS(10),
    width: rS(40),
    height: vS(40),
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
