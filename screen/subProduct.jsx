import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Text,
  FlatList,
  Alert
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { rS, vS, mS } from "@/style/responsive";
import InputField from "@/components/common/InputField";
import IconButton from "../components/common/IconButton";
import ArrowTitle from "../components/common/ArrowTitle";
import { AntDesign } from "@expo/vector-icons";
import * as SecureStore from 'expo-secure-store';
import Calendar from '../components/common/Calendar';

// Product Names List
const productNames = [
  'পুরুষদের কটন টি-শার্ট',
  'মহিলাদের শাড়ি',
  'লেডিস হ্যান্ডব্যাগ',
  'পুরুষদের জিন্স প্যান্ট',
  'ক্যাজুয়াল জুতা',
  'ঘড়ি',
  'সানগ্লাস',
  'স্মার্ট ফোন',
  'বাচ্চাদের খেলনা',
  'মেকাপ সেট',
  'কম্পিউটার ল্যাপটপ',
  'লেডিস সুইটার',
  'ইয়ারফোন',
  'পাঞ্জাবি',
  'কুশন কভার'
];

// SecureStore key constant
const PRODUCTS_STORAGE_KEY = 'sub_product_data';

// Product Name Picker Component
const ProductNamePicker = ({ visible, onSelect, onClose }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={pickerStyles.modalOverlay}>
        <View style={pickerStyles.pickerContainer}>
          <Text style={pickerStyles.headerTitle}>পণ্য নির্বাচন করুন</Text>

          <FlatList
            data={productNames}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={pickerStyles.itemContainer}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={pickerStyles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
            style={pickerStyles.list}
          />

          <TouchableOpacity
            style={pickerStyles.cancelButton}
            onPress={onClose}
          >
            <Text style={pickerStyles.buttonText}>বাতিল</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};



const AddProductScreen = () => {
  const [product, setProduct] = useState({
    id: Date.now().toString(), // Unique ID for each product
    date: '',
    name: '',
    price: '',
    quantity: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateSelect = (formattedDate) => {
    setProduct({ ...product, date: formattedDate });
    setShowDatePicker(false);
  };

  const handleNameSelect = (name) => {
    setProduct({ ...product, name: name });
    setShowNamePicker(false);
  };

  // Create separate handlers for each input field
  const handleNameChange = (text) => {
    setProduct({ ...product, name: text });
  };

  const handlePriceChange = (text) => {
    setProduct({ ...product, price: text });
  };

  const handleQuantityChange = (text) => {
    setProduct({ ...product, quantity: text });
  };

  // Function to get existing products from SecureStore
  const getStoredProducts = async () => {
    try {
      const productsJson = await SecureStore.getItemAsync(PRODUCTS_STORAGE_KEY);
      return productsJson ? JSON.parse(productsJson) : [];
    } catch (error) {
      console.error('Error fetching stored products:', error);
      return [];
    }
  };

  // Function to save products to SecureStore
  const saveProducts = async (products) => {
    try {
      await SecureStore.setItemAsync(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      return true;
    } catch (error) {
      console.error('Error saving products:', error);
      return false;
    }
  };

  // Validate product data
  const validateProduct = () => {
    if (!product.date) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে একটি তারিখ নির্বাচন করুন');
      return false;
    }
    if (!product.name) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে পণ্যের নাম লিখুন');
      return false;
    }
    if (!product.price) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে পণ্যের মূল্য লিখুন');
      return false;
    }
    if (!product.quantity) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে পণ্যের পরিমাণ লিখুন');
      return false;
    }
    return true;
  };

  // Function to clear all product data from SecureStore
  const clearAllProducts = async () => {
    try {
      await SecureStore.deleteItemAsync(PRODUCTS_STORAGE_KEY);
      Alert.alert('সফল', 'সকল পণ্যের তথ্য মুছে ফেলা হয়েছে');
      return true;
    } catch (error) {
      console.error('Error clearing products:', error);
      Alert.alert('ত্রুটি', 'পণ্যের তথ্য মুছতে সমস্যা হয়েছে');
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateProduct()) {
      return;
    }

    setIsLoading(true);
    try {
      // Get existing products
      const existingProducts = await getStoredProducts();

      // Add new product to the array
      const updatedProducts = [...existingProducts, {
        ...product,
        id: Date.now().toString(), // Ensure unique ID
      }];

      // Save updated products array
      const success = await saveProducts(updatedProducts);

      if (success) {
        Alert.alert('সফল', 'পণ্য সফলভাবে যুক্ত করা হয়েছে');

        // Reset form after successful submission
        setProduct({
          id: Date.now().toString(),
          date: '',
          name: '',
          price: '',
          quantity: '',
          image: 'https://cdn-icons-png.flaticon.com/512/9486/9486994.png',
        });
      } else {
        Alert.alert('ত্রুটি', 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error('Error in submit handler:', error);
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
            <ArrowTitle
              title="পণ্য বিয়োগ করুন"
            />
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.image}
            />
          </View>

          <View style={styles.inputContainer}>
            {/* Date Input Field with custom onPress handler */}
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View>
                <Text style={styles.dateTitle}>তারিখ</Text>
                <View style={styles.dateContainer}>
                  <AntDesign name="calendar" size={24} color="black" style={styles.dateIcon} />
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

            {/* Product Name Input with Picker */}
            <TouchableOpacity onPress={() => setShowNamePicker(true)}>
              <View>
                <Text style={styles.inputTitle}>পণ্যের নাম</Text>
                <View style={styles.inputFieldContainer}>
                  <AntDesign name="cubes" size={24} color="#757575" style={styles.fieldIcon} />
                  <Text style={styles.fieldInput}>
                    {product.name || "যেমন, পুরুষদের জন্য ফ্যাশনেবল টি শার্ট"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Product Name Picker */}
            <ProductNamePicker
              visible={showNamePicker}
              onSelect={handleNameSelect}
              onClose={() => setShowNamePicker(false)}
            />

            <InputField
              title="মূল্য"
              placeholder="যেমন, ২২০০ টাকা"
              iconName="tag"
              value={product.price}
              onChangeText={handlePriceChange}
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
            title="বিয়োগ করুন"
            iconName="file-o"
            style={styles.checkButton}
            onPress={handleSubmit}
            disabled={isLoading}
          />

          <IconButton
            title="সব ডাটা মুছুন"
            iconName="trash-o"
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                'নিশ্চিতকরণ',
                'আপনি কি সত্যিই সকল পণ্যের ডাটা মুছে ফেলতে চান?',
                [
                  {
                    text: 'না',
                    style: 'cancel',
                  },
                  {
                    text: 'হ্যাঁ',
                    onPress: clearAllProducts,
                  },
                ],
                { cancelable: true }
              );
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddProductScreen;

// Picker Styles
const pickerStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '90%',
    maxWidth: 350,
    maxHeight: '80%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#202634',
  },
  list: {
    maxHeight: 400,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#e24a4a',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

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
  icon: {
    fontSize: mS(30),
  },
  imageContainer: {
    alignItems: "center",
    marginTop: mS(30),
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
    marginBottom: mS(10),
  },
  clearButton: {
    marginLeft: mS(10),
    backgroundColor: '#e74c3c',
  },
  dateContainer: {
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
  dateTitle: {
    marginTop: mS(10),
    fontSize: mS(15),
    marginBottom: mS(5),
    color: '#202634',
    marginLeft: mS(5),
  },
  dateInput: {
    width: rS(220),
    fontSize: mS(14),
    color: 'black',
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
    color: '#202634',
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
  },
  fieldInput: {
    width: rS(220),
    fontSize: mS(14),
    color: 'black',
    flex: 1,
  },
});