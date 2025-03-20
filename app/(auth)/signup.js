import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Button } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/common/InputField";
import CustomButton from "@/components/common/CustomButton";
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { rS, vS, mS } from "@/style/responsive";
import { auth, db } from "../../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const SignUp = () => {
  const router = useRouter();

  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [role, setRole] = useState("admin"); // Default role

  const [form, setForm] = useState({
    picture: null,
    email: "",
    password: "",
    accountType: "admin",
  });

  
  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;
  
      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: form.accountType, 
        picture: form.picture, 
      });
  
      console.log("User created:", user.email);
      alert("Account successfully created!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

const handleLogin = () => {
  router.replace("/(auth)/signin");
}

const goToDashboard = () => {
  router.replace("/(tabs)/Home");
}

  const handleImagePicker = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.5,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const imageUri = response.assets?.[0].uri;
        setForm({ ...form, picture: imageUri });
      }
    });
  };

  const handleCameraLaunch = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.5,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
      } else {
        const imageUri = response.assets?.[0].uri;
        setForm({ ...form, picture: imageUri });
      }
    });
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>ক</Text>
          </View>
          <Text style={styles.appName}>মেসার্স কাশেম গার্মেন্টস</Text>
          <Text style={[styles.appTagline]}>আপনাকে দোকানের হিসাব নিয়ন্ত্রণ অ্যাপ এ স্বাগতম</Text>

          <View style={styles.inputContainer}>

            <View style={styles.imageUploadContainer}>
              <Text style={styles.inputTitle}>আপনার একটি ছবি প্রদান করুন</Text>
              <TouchableOpacity style={styles.imagePlaceholder} onPress={() => {
                Alert.alert(
                  "Choose Image Source",
                  "Select how you want to upload your picture",
                  [
                    {
                      text: "Camera",
                      onPress: handleCameraLaunch,
                    },
                    {
                      text: "Gallery",
                      onPress: handleImagePicker,
                    },
                    { text: "Cancel", onPress: () => console.log("Cancel Pressed"), style: "cancel" },
                  ],
                  { cancelable: true }
                );
              }}>
                {form.picture ? (
                  <Image source={{ uri: form.picture }} style={styles.uploadedImage} />
                ) : (
                  <Icon name="camera" size={25} color="#757575" />
                )}
              </TouchableOpacity>
            </View>


            <InputField
              iconName="mobile-phone"
              title="আপনার মোবাইল নম্বর লিখুন"
              placeholder='যেমন: ০১০১১-১০০১১০'
              // value={email}
              // handleChangeText={text => setEmail(text)}
              value={form.email}
              handleChangeText={(text) => setForm({ ...form, email: text })}
              keyboardType="phone-pad"
              otherStyles={styles.inputFieldStyle}
            />

            <InputField
              iconName="lock"
              title="আপনার পাসওয়ার্ড লিখুন"
              placeholder='**** **** ****'
              // value={password}
              // handleChangeText={text => setPassword(text)}
              value={form.password}
              handleChangeText={(text) => setForm({ ...form, password: text })}
              secureTextEntry={true}
              otherStyles={styles.inputFieldStyle}
            />

          </View>

          <View style={styles.accountTypeContainer}>
            <Text style={styles.inputTitle}>অ্যাকাউন্টের ধরণ</Text>
            <View style={styles.accountTypeButtons}>
              <TouchableOpacity
                style={[styles.accountTypeButton, form.accountType === 'admin' && styles.accountTypeButtonActive]}
                onPress={() => setForm({ ...form, accountType: 'admin' })}
                // onPress={() => form.accountType('admin')}
              >
                <Text style={[styles.accountTypeButtonText, form.accountType === 'admin' && styles.accountTypeButtonTextActive]}>এডমিন</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.accountTypeButton, form.accountType === 'editor' && styles.accountTypeButtonActive]}
                onPress={() => setForm({ ...form, accountType: 'editor' })}
                // onPress={() => form.accountType('editor')}
              >
                <Text style={[styles.accountTypeButtonText, form.accountType === 'editor' && styles.accountTypeButtonTextActive]}>এডিটর</Text>
              </TouchableOpacity>
            </View>
          </View>


          <CustomButton
            title="অ্যাকাউন্ট তৈরি করুন"
            onPress={handleSignUp}
            // onPress={goToDashboard}
            otherStyles={styles.signUpButton}
          />

          <TouchableOpacity style={styles.loginLinkContainer} onPress={handleLogin}>
            <Text style={styles.loginLink}>আমার একটি অ্যাকাউন্ট রয়েছে</Text>
            <View style={styles.loginButton}>
              <Text style={styles.loginButtonText}>লগইন করুন</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToDashboard}>
            <Text>Go to dashboard</Text>
          </TouchableOpacity>

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
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: mS(20),
    width: "100%",
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: mS(30),
    width: rS(50),
    height: vS(45),
    borderRadius: 15,
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
    marginTop: mS(5),
    fontSize: mS(22),
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  appTagline: {
    fontSize: mS(12),
    marginTop: mS(5),
    color: 'gray',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: mS(25),
  },
  inputContainer: {
    width: '100%',
    marginLeft: mS(15),
  },
  inputTitle: {
    fontSize: mS(15),
    // marginBottom: mS(5),
    color: '#222222',
    textAlign: 'left',
    marginLeft: mS(-8),
  },
  inputFieldStyle: {
    marginTop: mS(5),
    marginLeft: mS(5),
  },
  imageUploadContainer: {
    marginBottom: mS(5),
    // width: rS(300),
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginLeft: mS(15),
  },
  imagePlaceholder: {
    padding: mS(30),
    borderRadius: mS(50),
    borderColor: '#D3D3D3',
    borderWidth: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: mS(8),
    marginLeft: mS(-10),
  },
  uploadedImage: {
    width: rS(70),
    height: vS(70),
    borderRadius: 50,
  },
  accountTypeContainer: {
    marginTop: mS(20),
    width: '90%',
  },
  accountTypeButtons: {
    borderColor: '#4caf50',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: mS(10),
    marginTop: mS(12),
    marginLeft: mS(-10),
  },
  accountTypeButton: {
    backgroundColor: 'white',
    borderRadius: mS(8),
    paddingVertical: mS(12),
    paddingHorizontal: mS(25),
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  accountTypeButtonActive: {
    backgroundColor: '#4caf50',
  },
  accountTypeButtonText: {
    fontSize: mS(15),
    color: '#333',
  },
  accountTypeButtonTextActive: {
    color: 'white',
  },
  signUpButton: {
    marginLeft: mS(0),
    // marginTop: mS(30),
    // marginBottom: mS(20),
    // width: '90%',
    // maxWidth: mS(350),
    // paddingVertical: mS(14),
    // fontSize: mS(16),
  },
  loginLinkContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: mS(12),
  },
  loginLink: {
    fontSize: mS(14),
    color: 'black',
    marginBottom: mS(8),
  },
  loginButton: {
    width: rS(300),
    backgroundColor: 'white',
    borderRadius: 5,
    paddingVertical: mS(12),
    paddingHorizontal: mS(25),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#4caf50',
  },
  loginButtonText: {
    fontSize: mS(15),
    fontWeight: '700',
    color: '#4caf50',
  },
});

export default SignUp;
