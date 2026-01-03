import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  Alert
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { rS, mS } from "@/style/responsive";
import InputField from "@/components/common/InputField";
import IconButton from "../components/common/IconButton";
import ArrowTitle from "../components/common/ArrowTitle";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { productService } from "../service/api/product";
import { notificationService } from '../service/api/notification';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '../config/auth';

// Add this import at the top of your file
const defaultProductImage = require('../assets/images/addProductIcon.png');
import Calendar from '../components/common/Calendar';

const AddProductScreen = () => {

  const [product, setProduct] = useState({
    date: '',
    name: '',
    wholesalePrice: '',
    retailPrice: '',
    quantity: '',
    image: defaultProductImage
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Set current date automatically
  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const currentDate = `${day}-${month}-${year}`;
    
    setProduct(prev => ({ ...prev, date: currentDate }));
  }, []);

  const handleDateSelect = (formattedDate) => {
    setProduct({ ...product, date: formattedDate });
    setShowDatePicker(false);
  };

  const handleNameChange = (text) => {
    // Don't trim while typing, only store the raw input
    setProduct({ ...product, name: text });
  };

  const handleWholesalePriceChange = (text) => {
    setProduct({ ...product, wholesalePrice: text });
  };

  const handleRetailPriceChange = (text) => {
    setProduct({ ...product, retailPrice: text });
  };

  const handleQuantityChange = (text) => {
    setProduct({ ...product, quantity: text });
  };

  // Validate product data
  const validateProduct = () => {
    if (!product.date) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে একটি তারিখ নির্বাচন করুন');
      return false;
    }

    // Validate name is not empty after trimming
    const trimmedName = product.name.trim();
    if (!trimmedName) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে পণ্যের নাম লিখুন');
      return false;
    }

    if (!product.wholesalePrice) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে পাইকারি মূল্য লিখুন');
      return false;
    }
    if (!product.retailPrice) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে খুচরা মূল্য লিখুন');
      return false;
    }
    if (!product.quantity) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে পণ্যের পরিমাণ লিখুন');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateProduct()) return;

    setIsLoading(true);
    try {
      // Get current user data
      const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      const userData = JSON.parse(userDataStr);

      // Add product
      const result = await productService.addProduct({
        ...product,
        name: product.name.trim(),
        wholesalePrice: parseInt(product.wholesalePrice.replace(/[^\d০-৯]/g, '')),
        retailPrice: parseInt(product.retailPrice.replace(/[^\d০-৯]/g, '')),
        quantity: parseInt(product.quantity.replace(/[^\d০-৯]/g, '')),
        image: product.image.uri || product.image
      });

      if (result.success) {
        const notificationData = {
          action: 'add_product',
          by: userData.email,
          productName: product.name.trim(),
          quantity: parseInt(product.quantity.replace(/[^\d০-৯]/g, '')),
          productId: result.id,
          timestamp: new Date().toISOString()
        };

        // await notificationService.createLog(notificationData);

        const resetProductForm = () => {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          const currentDate = `${day}-${month}-${year}`;
          
          setProduct({
            date: currentDate,
            name: '',
            wholesalePrice: '',
            retailPrice: '',
            quantity: '',
            image: defaultProductImage,
          });
        };

        const handleRedirect = () => {
          resetProductForm();
        };

        Alert.alert(
          'সফল',
          'পণ্য সফলভাবে যুক্ত করা হয়েছে',
          [
            {
              text: 'ঠিক আছে',
              onPress: handleRedirect
            }
          ]
        );
      } else {
        Alert.alert('ত্রুটি', result.error || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      Alert.alert('ত্রুটি', 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.topContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(tabs)/Home")}>
              <ArrowTitle />
            </TouchableOpacity>
            <Text style={styles.headerText}> পণ্য যুক্ত করুন </Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={typeof product.image === 'string' ? { uri: product.image } : product.image}
              style={styles.image}
            />
          </View>

          <View style={styles.inputContainer}>
            {/* Date Input Field with custom onPress handler */}
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View>
                <Text style={styles.dateTitle}>তারিখ</Text>
                <View style={styles.dateContainer}>
                  <AntDesign name="calendar" style={styles.dateIcon} />
                  <Text style={styles.dateInput}>{product.date || `যেমন, ০১-০১-২০০০`}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Custom Calendar Component */}
            <Calendar
              visible={showDatePicker}
              onSelectDate={handleDateSelect}
              onClose={() => setShowDatePicker(false)}
            />

            <InputField
              title="পণ্যের নাম"
              placeholder="যেমন, পুরুষদের জন্য ফ্যাশনেবল টি শার্ট"
              iconName="edit"
              value={product.name}
              handleChangeText={handleNameChange}
              otherStyles={styles.inputFieldStyle}
            />

            <InputField
              title="পাইকারি মূল্য"
              placeholder="যেমন, ২০০০ টাকা"
              iconName="tag"
              value={product.wholesalePrice}
              onChangeText={handleWholesalePriceChange}
              keyboardType="numeric"
            />

            <InputField
              title="খুচরা মূল্য"
              placeholder="যেমন, ২২০০ টাকা"
              iconName="tag"
              value={product.retailPrice}
              onChangeText={handleRetailPriceChange}
              keyboardType="numeric"
            />

            <InputField
              title="পরিমান"
              placeholder="যেমন, ২২ টি"
              iconName="cube"
              value={product.quantity}
              onChangeText={handleQuantityChange}
              keyboardType="numeric"
            />
          </View>

          <IconButton
            title="যুক্ত করুন"
            iconName="file-o"
            style={styles.checkButton}
            onPress={handleSubmit}
            disabled={isLoading}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddProductScreen;

// Main Styles
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
    paddingVertical: mS(10),
    paddingHorizontal: mS(20),
    width: "100%",
  },
  topContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    color: 'black',
    fontSize: mS(25),
    fontWeight: '600',
    marginTop: mS(-20),
  },
  icon: {
    fontSize: mS(30),
  },
  imageContainer: {
    alignItems: "center",
    marginTop: mS(-15),
  },
  image: {
    width: rS(130),
    height: rS(130),
    borderRadius: 10,
  },
  inputContainer: {
    marginLeft: mS(10),
  },
  checkButton: {
    marginLeft: mS(10),
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: rS(300),
    backgroundColor: '#FFFFFF',
    borderColor: '#D3D3D3',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: mS(10),
    paddingVertical: mS(12),
  },
  dateTitle: {
    marginTop: mS(10),
    fontSize: mS(15),
    marginBottom: mS(5),
    color: 'black',
    marginLeft: mS(5),
  },
  dateInput: {
    width: rS(220),
    fontSize: mS(14),
    color: '#757575',
    flex: 1,
  },
  dateIcon: {
    fontSize: mS(20),
    color: '#757575',
    marginRight: mS(8),
    marginLeft: mS(5),
  },
  // Styles for the product name field
  inputTitle: {
    marginTop: mS(10),
    fontSize: mS(15),
    marginBottom: mS(5),
    color: 'black',
    marginLeft: mS(5),
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: rS(300),
    backgroundColor: '#FFFFFF',
    borderColor: '#D3D3D3',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: mS(12),
    paddingVertical: mS(10),
  },
  fieldIcon: {
    fontSize: mS(20),
    marginRight: mS(8),
    marginLeft: mS(5),
    color: "#757575"
  },
  fieldInput: {
    width: rS(220),
    fontSize: mS(14),
    color: '#757575',
    flex: 1,
  },
});