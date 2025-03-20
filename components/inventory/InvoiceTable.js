import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { rS, vS, mS } from '@/style/responsive';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from "expo-secure-store";

const PRODUCTS_STORAGE_KEY = "product_data";
const INVOICES_STORAGE_KEY = "invoices_data";

const initialRows = [
  { id: 1, product: null, price: 0, quantity: 0, total: 0 },
  { id: 2, product: null, price: 0, quantity: 0, total: 0 },
  { id: 3, product: null, price: 0, quantity: 0, total: 0 },
  { id: 4, product: null, price: 0, quantity: 0, total: 0 },
  { id: 5, product: null, price: 0, quantity: 0, total: 0 },
  { id: 6, product: null, price: 0, quantity: 0, total: 0 },
];

const InvoiceTable = () => {
  const [rows, setRows] = useState(initialRows);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantityError, setQuantityError] = useState('');
  
  // Maximum quantity allowed
  const MAX_QUANTITY = 99;
  
  // Fetch products from SecureStore when component mounts
  useFocusEffect(
    React.useCallback(() => {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const storedProductsJson = await SecureStore.getItemAsync(
            PRODUCTS_STORAGE_KEY
          );

          if (storedProductsJson) {
            const storedProducts = JSON.parse(storedProductsJson);
            setProducts(storedProducts);
            console.log("Products fetched from SecureStore:", storedProducts);
          } else {
            console.log("No products found in SecureStore");
            setProducts([]);
          }
        } catch (error) {
          console.error("Error fetching products from SecureStore:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }, [])
  );

  const handleProductChange = (productId, rowIndex) => {
    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        const selectedProduct = products.find((p) => p.id === productId);
        if (selectedProduct) {
          // Set initial quantity to 1 or the product's quantity if it's less than 1
          const initialQuantity = parseInt(selectedProduct.quantity) > 0 ? 
            Math.min(1, parseInt(selectedProduct.quantity)) : 0;
          
          return { 
            ...row, 
            product: selectedProduct, 
            price: parseInt(selectedProduct.price) || 0, 
            quantity: initialQuantity,
            maxQuantity: parseInt(selectedProduct.quantity) || 0 // Store max quantity
          };
        }
        return { ...row, product: null, price: 0, quantity: 0, maxQuantity: 0 };
      }
      return row;
    });
    setRows(updatedRows);
  };
  
  const handleQuantityChange = (quantity, rowIndex) => {
    // Convert input to number, use 0 if not a valid number
    const numericQuantity = parseInt(quantity) || 0;
    
    const currentRow = rows[rowIndex];
    const availableQuantity = currentRow.maxQuantity || 0;
    
    // Check if quantity exceeds the available quantity for this product
    if (numericQuantity > availableQuantity) {
      setQuantityError(`পরিমাণ অতিরিক্ত! ${currentRow.product?.name} এর সর্বোচ্চ ${availableQuantity} পরিমাণ উপলব্ধ।`);
      // Can optionally show an alert
      Alert.alert('পরিমাণ অতিরিক্ত', `${currentRow.product?.name} এর সর্বোচ্চ ${availableQuantity} পরিমাণ উপলব্ধ।`);
    } else {
      setQuantityError('');
    }
    
    // Ensure quantity doesn't exceed the available quantity
    const limitedQuantity = Math.min(numericQuantity, availableQuantity);
    
    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        return { ...row, quantity: limitedQuantity };
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

  // Function to save the invoice data to SecureStore
  const handleSaveInvoice = async () => {
    try {
      // Filter out empty rows where no product is selected
      const filledRows = rows.filter(row => row.product !== null);
      
      if (filledRows.length === 0) {
        Alert.alert('ত্রুটি', 'কমপক্ষে একটি পণ্য নির্বাচন করুন');
        return;
      }

      // Prepare invoice data
      const invoiceData = {
        id: Date.now().toString(), // Unique ID based on timestamp
        date: new Date().toISOString(),
        banglaDate: formatToBanglaDate(new Date()),
        items: filledRows.map(row => ({
          productId: row.product.id,
          productName: row.product.name,
          price: row.price,
          quantity: row.quantity,
          total: row.price * row.quantity
        })),
        // grandTotal: calculateGrandTotal(),
        // previousDue: 1000, 
        // deposit: 9000,     
        // currentDue: 3000,  
        // description: "তিন হাজার টাকা মাত্র" 
      };

      // First, get existing invoices (if any)
      const existingInvoicesJson = await SecureStore.getItemAsync(INVOICES_STORAGE_KEY);
      let allInvoices = [];
      
      if (existingInvoicesJson) {
        allInvoices = JSON.parse(existingInvoicesJson);
      }
      
      // Add the new invoice
      allInvoices.push(invoiceData);
      
      // Save the updated invoices list back to SecureStore
      await SecureStore.setItemAsync(
        INVOICES_STORAGE_KEY,
        JSON.stringify(allInvoices)
      );
      
      // Log the saved data
      console.log('Invoice saved to SecureStore:', invoiceData);
      
      // Update product quantities in storage
      await updateProductQuantities(filledRows);

      // Show success message
      Alert.alert('সফল', 'ইনভয়েস সংরক্ষণ করা হয়েছে!');
      
      // Reset the form
      setRows(initialRows);
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('ত্রুটি', 'ইনভয়েস সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Function to clear all invoices from SecureStore
  const handleClearInvoices = () => {
    Alert.alert(
      'সতর্কতা',
      'আপনি কি সকল ইনভয়েস ডাটা মুছে ফেলতে চান?',
      [
        {
          text: 'বাতিল',
          style: 'cancel',
        },
        {
          text: 'মুছে ফেলুন',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync(INVOICES_STORAGE_KEY);
              console.log('All invoices have been deleted from SecureStore');
              Alert.alert('সফল', 'সকল ইনভয়েস ডাটা মুছে ফেলা হয়েছে।');
            } catch (error) {
              console.error('Error clearing invoices:', error);
              Alert.alert('ত্রুটি', 'ইনভয়েস ডাটা মুছে ফেলতে সমস্যা হয়েছে।');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Helper function to update product quantities in storage after invoice is saved
  const updateProductQuantities = async (filledRows) => {
    try {
      // Create a map of product changes
      const productChanges = {};
      
      // Calculate how much of each product is being used in this invoice
      filledRows.forEach(row => {
        if (row.product && row.quantity > 0) {
          productChanges[row.product.id] = (productChanges[row.product.id] || 0) + row.quantity;
        }
      });
      
      // Get current products
      const updatedProducts = [...products];
      
      // Update quantities
      updatedProducts.forEach(product => {
        if (productChanges[product.id]) {
          const currentQuantity = parseInt(product.quantity) || 0;
          const newQuantity = Math.max(0, currentQuantity - productChanges[product.id]);
          product.quantity = newQuantity.toString();
        }
      });
      
      // Save back to storage
      await SecureStore.setItemAsync(
        PRODUCTS_STORAGE_KEY,
        JSON.stringify(updatedProducts)
      );
      
      // Update local state
      setProducts(updatedProducts);
      
      console.log('Product quantities updated');
    } catch (error) {
      console.error('Error updating product quantities:', error);
    }
  };

  // Helper function to format date to Bangla format (DD-MM-YYYY)
  const formatToBanglaDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Convert to Bangla numerals
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const toBanglaNumeral = (numStr) => {
      return numStr.split('').map(digit => banglaDigits[parseInt(digit)]).join('');
    };
    
    return `${toBanglaNumeral(day)}-${toBanglaNumeral(month)}-${toBanglaNumeral(year.toString())}`;
  };

  return (
    <View style={styles.container}>
      {quantityError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{quantityError}</Text>
        </View>
      ) : null}
      
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
            <Text style={styles.cell}>{index + 1}</Text>
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
                {products.map((product) => (
                  <Picker.Item
                    key={product.id}
                    label={`${product.name} (${product.quantity})`}
                    value={product.id}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.cell}>{row.price} টাকা</Text>
            <TextInput
              style={styles.quantityInput}
              value={row.quantity.toString()}
              onChangeText={(text) => handleQuantityChange(text, index)}
              keyboardType="numeric"
              maxLength={2} // Restricts input to 2 digits
            />
            <Text style={styles.cell}>{calculateTotal(index)} টাকা</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={()=> router.push("(tabs)/AddProduct")}>
              <View style={styles.plusiconContainer}>
                <Icon name="plus" style={styles.buttonIcon} />
              </View>
              <Text style={styles.buttonText}>নতুন পণ্য</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={()=> router.push("(tabs)/SubProduct")}>
              <View style={styles.plusiconContainer}>
                <Icon name="plus" style={styles.buttonIcon} />
              </View>
              <Text style={styles.buttonText}>ফেরত পণ্য</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.plusiconContainer}>
                <Icon name="plus" style={styles.buttonIcon} />
              </View>
              <Text style={styles.buttonText}>বাকির হিসাব</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>সর্বমোট</Text>
          </View>
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValue}>{calculateGrandTotal()} টাকা</Text>
          </View>
        </View>

        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>পূর্বের বাকি</Text>
          <Text style={styles.accountValue}>১,০০০ টাকা</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>জমা</Text>
          <Text style={styles.accountValue}>৯,০০০ টাকা</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>বাকি</Text>
          <Text style={styles.accountValue}>৩,০০০ টাকা</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>কথায়</Text>
          <Text style={styles.accountValue}>তিন হাজার টাকা মাত্র</Text>
        </View>
        
        {/* Buttons Container */}
        <View style={styles.buttonsContainer}>
          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveInvoice}>
            <Text style={styles.saveButtonText}>সংরক্ষণ করুন</Text>
          </TouchableOpacity>
          
          {/* Clear Invoices Button */}
          <TouchableOpacity style={styles.clearButton} onPress={handleClearInvoices}>
            <Icon name="trash" size={16} style={styles.clearButtonIcon} />
            <Text style={styles.clearButtonText}>ইনভয়েস ডাটা মুছুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#ffecec',
    padding: mS(10),
    marginBottom: mS(10),
    borderRadius: mS(5),
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    fontSize: mS(14),
    textAlign: 'center',
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  headerCell: {
    flex: 1,
    fontSize: mS(14),
    padding: mS(8),
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cell: {
    flex: 1,
    padding: mS(8),
    textAlign: 'left',
    borderWidth: 1,
    fontSize: mS(14),
    borderColor: '#ddd',
  },
  productCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
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
    padding: mS(5),
    margin: mS(5),
    fontSize: mS(15),
    textAlign: 'center',
    borderColor: '#ddd',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalLabel: {
    fontWeight: '600',
    marginRight: mS(10),
    fontSize: mS(15),
  },
  totalValue: {
    fontSize: mS(15),
    fontWeight: '600',
  },
  buttons: {
    height: '100%',
    width: '45%',
    alignItems: 'flex-start',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: mS(10),
    paddingVertical: mS(5),
  },
  button: {
    width: rS(120),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: mS(10),
    paddingVertical: mS(5),
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: mS(15),
    fontWeight: '500',
    color: 'black',
  },
  plusiconContainer: {
    backgroundColor: '#4caf50',
    height: mS(25),
    width: mS(25),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mS(50),
    marginTop: mS(2),
    marginRight: mS(5),
    marginBottom: mS(2),
  },
  buttonIcon: {
    color: 'white',
    fontSize: mS(14),
    fontWeight: '500',
  },
  totalContainer: {
    height: '100%',
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRightWidth: 1,
    borderColor: '#ddd',
    padding: mS(10),
  },
  totalValueContainer: {
    width: '25%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: mS(10),
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: mS(8),
    paddingHorizontal: mS(12),
  },
  accountLabel: {
    flex: 1,
    textAlign: 'left',
    fontSize: mS(14),
    paddingRight: mS(10),
  },
  accountValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: mS(14),
    paddingLeft: mS(10),
  },
  middleLine: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginVertical: mS(10), 
  },
  buttonsContainer: {
    marginVertical: mS(15),
    marginHorizontal: mS(15),
  },
  saveButton: {
    backgroundColor: '#4caf50',
    paddingVertical: mS(12),
    borderRadius: mS(5),
    alignItems: 'center',
    marginBottom: mS(10),
  },
  saveButtonText: {
    color: 'white',
    fontSize: mS(16),
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: mS(8),
    borderRadius: mS(5),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: mS(14),
    fontWeight: 'bold',
  },
  clearButtonIcon: {
    color: 'white',
    marginRight: mS(8),
  }
});

export default InvoiceTable;