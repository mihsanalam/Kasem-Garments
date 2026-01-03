import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { rS, vS, mS } from '@/style/responsive';
import * as SecureStore from "expo-secure-store";
import Calendar from './common/Calendar';
// import productService from '@/services/productService'; // Import productService
import {productService} from '../service/api/product'; // Adjust the import path as necessary
import {notificationService} from '../service/api/notification'; // Import notificationService
import {returnProductService} from '../service/api/returnProduct'; // Import returnProductService

// Storage keys
const PRODUCTS_STORAGE_KEY = "product_data";
const RETURNED_PRODUCTS_KEY = "returned_products_data";
const SECURE_STORE_KEYS = {
  USER_DATA: "user_data"
};

// Modal component for returned products
const ReturnProductModal = ({
  visible,
  onClose,
  products,
  data,
  setData,
  customerName,
  onSaveReturns,
  priceType // Add priceType prop
}) => {
  const initialRows = [
    { id: 1, product: null, price: 0, quantity: 0, total: 0 },
    { id: 2, product: null, price: 0, quantity: 0, total: 0 },
  ];

  const [rows, setRows] = useState(initialRows);
  const [returnDate, setReturnDate] = useState(formatToBanglaDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper function to format date to Bangla format (DD-MM-YYYY)
  function formatToBanglaDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // Convert to Bangla numerals
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBanglaNumeral = (numStr) => {
      return numStr.split('').map(digit => banglaDigits[parseInt(digit)]).join('');
    };

    return `${toBanglaNumeral(day)}-${toBanglaNumeral(month)}-${toBanglaNumeral(year.toString())}`;
  }

  // Helper function to convert number to Bangla numerals
  const convertToBanglaNumeral = (number) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return number.toString().split('').map(digit =>
      isNaN(parseInt(digit)) ? digit : banglaDigits[parseInt(digit)]
    ).join('');
  };

  // Update groupProductsByName to include both prices
  const groupProductsByName = (products) => {
    const grouped = {};
    products.forEach(product => {
      if (!grouped[product.name]) {
        grouped[product.name] = {
          id: product.id,
          name: product.name,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          quantity: parseInt(product.quantity) || 0
        };
      } else {
        grouped[product.name].quantity += parseInt(product.quantity) || 0;
      }
    });
    return Object.values(grouped);
  };

  // Function to add a new row
  const addNewRow = () => {
    const newRowId = rows.length > 0 ? Math.max(...rows.map(row => row.id)) + 1 : 1;
    const newRow = { id: newRowId, product: null, price: 0, quantity: 0, total: 0 };
    setRows([...rows, newRow]);
  };

  const handleProductChange = (productId, rowIndex) => {
    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct) {
          // Use the correct price based on priceType
          const price = priceType === 'wholesale' ?
            parseInt(selectedProduct.wholesalePrice) || 0 :
            parseInt(selectedProduct.retailPrice) || 0;

          return {
            ...row,
            product: selectedProduct,
            productName: selectedProduct.name,
            price: price,
            quantity: 1,
            maxQuantity: parseInt(selectedProduct.currentStock) || 0,
            total: price // Initialize total
          };
        }
        return { ...row, product: null, price: 0, quantity: 0, maxQuantity: 0, total: 0 };
      }
      return row;
    });
    setRows(updatedRows);
  };

  const handleQuantityChange = (quantity, rowIndex) => {
    // Convert input to number, use 0 if not a valid number
    const numericQuantity = parseInt(quantity) || 0;

    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        return { ...row, quantity: numericQuantity };
      }
      return row;
    });

    setRows(updatedRows);
  };

  const calculateTotal = (rowIndex) => {
    const row = rows[rowIndex];
    return row.price * row.quantity;
  };

  const calculateGrandTotal = () => {
    return rows.reduce((acc, row) => acc + row.price * row.quantity, 0);
  };

  const handleSaveReturns = async () => {
    try {
      const filledRows = rows.filter(row => row.product !== null && row.quantity > 0);
      if (filledRows.length === 0) {
        Alert.alert('ত্রুটি', 'কমপক্ষে একটি পণ্য নির্বাচন করুন');
        return;
      }

      // Get current user data for notification
      const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      const userData = JSON.parse(userDataStr);

      // Process each returned product
      for (const row of filledRows) {
        // Update product stock in Firebase (adding back to inventory)
        await productService.updateProductStock(
          row.product.id,
          row.quantity,
          'in',
          'Return through invoice',
          userData?.email || 'unknown'
        );
      }

      // Create notification log for the return
      await notificationService.createLog({
        action: 'return',
        by: userData.email,
        productName: filledRows.map(row => `${row.product.name} (${row.quantity})`).join(', '),
        quantity: filledRows.reduce((total, row) => total + row.quantity, 0)
      });

      const returnData = {
        items: filledRows.map(row => ({
          id: `return-${Date.now()}-${row.product.id}`,
          productId: row.product.id,
          productName: row.product.name,
          price: row.price,
          quantity: row.quantity,
          total: row.price * row.quantity,
          priceType: priceType, // Add price type
          isReturn: true,
          affectsStock: true
        })),
        date: convertBanglaDateToISO(returnDate), // Convert Bangla date to ISO format for storage
        displayDate: returnDate, // Keep the Bangla date for display
        customerName: customerName,
        isReturn: true,
        affectsStock: true
      };

      // Save to Firebase returnedProducts collection
      const firebaseReturnData = {
        customerName: customerName,
        items: filledRows.map(row => ({
          productId: row.product.id,
          productName: row.product.name,
          price: -Math.abs(row.price), // Make price negative to indicate return
          quantity: row.quantity,
          total: -Math.abs(row.price * row.quantity), // Make total negative
          priceType: priceType, // Add price type
        })),
        staffEmail: userData.email,
        staffName: userData.email.split('@')[0],
        date: convertBanglaDateToISO(returnDate) // Convert Bangla date to ISO format for storage
      };

      // We'll only save to Firebase here, not to local storage
      const result = await returnProductService.addReturnedProduct(firebaseReturnData);

      if (!result.success) {
        console.error('Error saving returned product to Firebase:', result.error);
        // Continue anyway to maintain local functionality
      } else {
        console.log('Returned product saved to Firebase successfully');
      }

      // Also save to local storage for backward compatibility
      onSaveReturns(returnData);
      setRows(initialRows);
      onClose();

    } catch (error) {
      console.error('Error processing returned products:', error);
      Alert.alert('ত্রুটি', 'ফেরত পণ্য প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    }
  };

  // Add date selection handler
  const handleDateSelect = (formattedDate) => {
    // Store the formatted Bangla date for display
    setReturnDate(formattedDate);
    setShowDatePicker(false);
  };

  // Convert Bangla date to ISO format for storage
  const convertBanglaDateToISO = (banglaDate) => {
    if (!banglaDate) return new Date().toISOString();

    // Bangla digits mapping
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    // Convert Bangla digit to regular digit
    const toRegularDigit = (banglaDigit) => {
      return banglaDigits.indexOf(banglaDigit);
    };

    // Extract parts from Bangla date format (DD-MM-YYYY)
    try {
      const parts = banglaDate.split('-');
      if (parts.length !== 3) return new Date().toISOString();

      const day = parseInt(parts[0].split('').map(d => toRegularDigit(d)).join(''));
      const month = parseInt(parts[1].split('').map(d => toRegularDigit(d)).join('')) - 1; // Months are 0-indexed
      const year = parseInt(parts[2].split('').map(d => toRegularDigit(d)).join(''));

      const date = new Date(year, month, day);
      return date.toISOString();
    } catch (error) {
      console.error('Error converting Bangla date:', error);
      return new Date().toISOString();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ফেরত পণ্য</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" style={styles.modalCloseIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.headerInputsContainer}>
              <View style={styles.inputDiv}>
                <Text style={styles.label}>তারিখ</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateText}>{returnDate}</Text>
                  </View>
                </TouchableOpacity>

                <Calendar
                  visible={showDatePicker}
                  onSelectDate={handleDateSelect}
                  onClose={() => setShowDatePicker(false)}
                />
              </View>
              <View style={styles.inputDiv}>
                <Text style={styles.label}>গ্রাহকের নাম</Text>
                <TextInput
                  style={styles.input}
                  value={customerName} // Use the prop directly
                  editable={false} // Make it read-only since it comes from the invoice
                  placeholder="গ্রাহকের নাম"
                />
              </View>
            </View>

            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>নং</Text>
                <Text style={styles.headerCell}>বিবরণ</Text>
                <Text style={styles.headerCell}>মূল্য</Text>
                <Text style={styles.headerCell}>পরিমাণ</Text>
                <Text style={styles.headerCell}>মোট</Text>
              </View>

              {rows.map((row, index) => (
                <View style={styles.row} key={row.id}>
                  <Text style={styles.cell}>{convertToBanglaNumeral(index + 1)}</Text>
                  <View style={styles.productCell}>
                    <Text style={styles.productName}>
                      {row.product ? row.product.name : 'পণ্য নির্বাচন করুন'}
                    </Text>
                    <Picker
                      selectedValue={row.product ? row.product.id : null}
                      style={styles.picker}
                      onValueChange={(itemValue) => handleProductChange(itemValue, index)}
                    >
                      <Picker.Item label="পণ্য নির্বাচন করুন" value={null} />
                      {groupProductsByName(products).map((product) => (
                        <Picker.Item
                          key={product.id}
                          label={`${product.name} (${priceType === 'wholesale' ?
                            product.wholesalePrice : product.retailPrice} টাকা)`}
                          value={product.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  <Text style={styles.cell}>{convertToBanglaNumeral(row.price)} টাকা</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={row.quantity.toString()}
                    onChangeText={(text) => handleQuantityChange(text, index)}
                    keyboardType="numeric"
                    maxLength={3}
                    editable={row.product !== null}
                  />
                  <Text style={styles.cell}>{convertToBanglaNumeral(calculateTotal(index))} টাকা</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.addButton} onPress={addNewRow}>
                <Icon name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>নতুন রো যোগ করুন</Text>
              </TouchableOpacity>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>সর্বমোট</Text>
                <Text style={styles.totalValue}>{convertToBanglaNumeral(calculateGrandTotal())} টাকা</Text>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveReturns}>
                <Text style={styles.saveButtonText}>সংরক্ষণ করুন</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>বাতিল করুন</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: mS(20),
    shadowColor: '#000',
    shadowOffset: {
      width: mS(0),
      height: mS(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: mS(15),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: mS(10),
  },
  modalTitle: {
    fontSize: rS(18),
    fontWeight: '700',
    color: '#333',
  },
  modalCloseIcon: {
     color:"#000",
    fontSize: rS(20),
  },
  headerInputsContainer: {
    marginBottom: rS(15),
  },
  inputDiv: {
    marginBottom: rS(10),
  },
  label: {
    fontSize: rS(16),
    marginBottom: rS(5),
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: rS(8),
    fontSize: rS(16),
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: rS(15),
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    paddingVertical: rS(10),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: rS(15),
    color: '#444',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: rS(10),
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: rS(14),
  },
  productCell: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    flex: 1,
    fontSize: mS(14),
    padding: mS(6),
    textAlign: 'center',
  },
  picker: {
    flex: 1,
    width: '100%',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: rS(5),
    textAlign: 'center',
    marginHorizontal: rS(5),
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: rS(10),
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: rS(10),
    marginHorizontal: rS(5),
  },
  addButtonText: {
    color: 'white',
    marginLeft: rS(5),
    fontSize: rS(16),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: rS(15),
    paddingHorizontal: rS(10),
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  totalLabel: {
    fontSize: rS(16),
    fontWeight: '600',
    color: '#222',
  },
  totalValue: {
    fontSize: rS(16),
    fontWeight: '600',
    color: '#222',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rS(10),
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: rS(12),
    paddingHorizontal: rS(16),
    borderRadius: 5,
    flex: 1,
    marginRight: rS(5),
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: rS(14),
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: rS(12),
    paddingHorizontal: rS(16),
    borderRadius: 5,
    flex: 1,
    marginLeft: rS(5),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: rS(14),
    fontWeight: 'bold',
  },
  dateButton: {
    width: '100%',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: mS(10),
    paddingVertical: mS(12),
    backgroundColor: 'white',
  },
  dateText: {
    fontSize: mS(14),
    fontWeight: '600',
    color: '#333',
  },
});

export default ReturnProductModal;