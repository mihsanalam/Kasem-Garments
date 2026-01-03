import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Modal, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { rS, vS, mS } from '@/style/responsive';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import ReturnProductModal from '../ReturnProductModal ';
import Calendar from '../common/Calendar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { notificationService } from '../../service/api/notification';
import { SECURE_STORE_KEYS } from '../../config/auth';
import { productService } from '../../service/api/product';
import { salesService } from '../../service/api/sales';
import { returnProductService } from '../../service/api/returnProduct';

// Storage keys
const INVOICES_STORAGE_KEY = "invoices_data";
const INVOICE_COUNTER_KEY = "invoice_counter";
const RETURNED_PRODUCTS_KEY = "returned_products_data";

const initialRows = [
  { id: 1, product: null, price: '', quantity: 0, total: 0 },
  { id: 2, product: null, price: '', quantity: 0, total: 0 },
  { id: 3, product: null, price: '', quantity: 0, total: 0 },
  { id: 4, product: null, price: '', quantity: 0, total: 0 },
  { id: 5, product: null, price: '', quantity: 0, total: 0 },
  { id: 6, product: null, price: '', quantity: 0, total: 0 },
];

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

// Add this helper function after the constants
const convertToBanglaNumeral = (number) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return number.toString().split('').map(digit =>
    isNaN(parseInt(digit)) ? digit : banglaDigits[parseInt(digit)]
  ).join('');
};

// Helper function to truncate text
const truncateText = (text, maxLength = 8) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '..';
};

const getNextInvoiceNumber = async () => {
  try {
    const currentCounter = await SecureStore.getItemAsync(INVOICE_COUNTER_KEY);
    const nextNumber = currentCounter ? parseInt(currentCounter) + 1 : 1;

    // Format to 4 digits with leading zeros
    const formattedNumber = String(nextNumber).padStart(4, '0');

    // Convert to Bengali numerals
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const bengaliNumber = formattedNumber
      .split('')
      .map(digit => bengaliNumerals[parseInt(digit)])
      .join('');

    return {
      number: nextNumber,
      formatted: bengaliNumber
    };
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    return {
      number: 1,
      formatted: '০০০১'
    };
  }
};

const updateInvoiceCounter = async (number) => {
  try {
    await SecureStore.setItemAsync(INVOICE_COUNTER_KEY, number.toString());
  } catch (error) {
    console.error('Error updating invoice counter:', error);
  }
};



const InvoiceTable = ({ data, setData, invoiceData, setInvoiceData }) => {
  const [rows, setRows] = useState(initialRows);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantityError, setQuantityError] = useState('');
  const [previousDue, setPreviousDue] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(formatToBanglaDate(new Date())); // Initialize with current date
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnProducts, setReturnProducts] = useState([]);
  const [priceType, setPriceType] = useState('wholesale'); // 'wholesale' or 'retail'

  // show and hide Past Due amount
  const [showAddInvoice, setShowAddInvoice] = useState(false);

  // Show and hide date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateSelect = (formattedDate) => {
    setDate(formattedDate);
    setShowDatePicker(false);
  };

  // Maximum quantity allowed
  const MAX_QUANTITY = 99;

  console.log(57, data)

  // Fetch products from Firebase when component mounts
  useFocusEffect(
    React.useCallback(() => {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const productsData = await productService.getAllProducts();
          if (productsData) {
            setProducts(productsData);
            console.log("Products fetched from Firebase:", productsData);
          } else {
            console.log("No products found in Firebase");
            setProducts([]);
          }
        } catch (error) {
          console.error("Error fetching products from Firebase:", error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }, [])
  );

  // Add this effect to load the initial serial number
  useFocusEffect(
    React.useCallback(() => {
      const initializeSerialNumber = async () => {
        const { formatted } = await getNextInvoiceNumber();
        setSerialNumber(formatted);
      };
      initializeSerialNumber();
    }, [])
  );

  // Add this effect to reset fields when invoice is saved
  React.useEffect(() => {
    if (!invoiceData) {
      setRows(initialRows);
      setPreviousDue(0);
      setDeposit(0);
      setDescription('');
      setDate(formatToBanglaDate(new Date()));
      setName('');
      setReturnProducts([]);

      // Get and set new invoice number
      const initializeSerialNumber = async () => {
        const { formatted } = await getNextInvoiceNumber();
        setSerialNumber(formatted);
      };
      initializeSerialNumber();
    }
  }, [invoiceData]);

  // Function to fetch all invoices from SecureStore
  const fetchInvoices = async () => {
    try {
      const storedInvoicesJson = await SecureStore.getItemAsync(INVOICES_STORAGE_KEY);

      if (storedInvoicesJson) {
        const storedInvoices = JSON.parse(storedInvoicesJson);
        // console.log("Invoices fetched from SecureStore:", storedInvoices);
        return storedInvoices;
      } else {
        // console.log("No invoices found in SecureStore");
        return [];
      }
    } catch (error) {
      // console.error("Error fetching invoices from SecureStore:", error);
      return [];
    }
  };

  // Function to add a new row
  const addNewRow = () => {
    const newRowId = rows.length > 0 ? Math.max(...rows.map(row => row.id)) + 1 : 1;
    const newRow = { id: newRowId, product: null, price: '', quantity: 0, total: 0 };
    setRows([...rows, newRow]);
  };

  const getAvailableProducts = (price) => {
    if (!price) return [];

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return [];

    // Log for debugging
    console.log("Looking for products with price:", numericPrice, "Price type:", priceType);

    // First, combine products with same name and price
    const combinedProducts = products.reduce((acc, product) => {
      const productPrice = priceType === 'wholesale' ?
        parseFloat(product.wholesalePrice || 0) :
        parseFloat(product.retailPrice || 0);

      // Log for debugging
      console.log(`Product: ${product.name}, Price: ${productPrice}, Stock: ${product.currentStock}`);

      // Use a more flexible price matching to account for floating point precision issues
      // Allow a small difference (0.5) to account for rounding errors
      const priceMatches = Math.abs(productPrice - numericPrice) < 0.5;

      if (!priceMatches) return acc;

      const key = product.name;
      if (!acc[key]) {
        acc[key] = {
          id: product.id,
          name: product.name,
          wholesalePrice: product.wholesalePrice,
          retailPrice: product.retailPrice,
          currentStock: 0,
          products: []
        };
      }
      acc[key].currentStock += parseInt(product.currentStock || 0);
      acc[key].products.push(product);
      return acc;
    }, {});

    // Convert to array and filter out products with no stock
    const availableProducts = Object.values(combinedProducts)
      .filter(product => product.currentStock > 0);

    // Log available products for debugging
    console.log("Available products:", availableProducts);

    return availableProducts;
  };

  const handleProductChange = (productId, rowIndex) => {
    if (!productId) return;

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    const selectedPrice = priceType === 'wholesale' ?
      parseFloat(selectedProduct.wholesalePrice) :
      parseFloat(selectedProduct.retailPrice);

    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      product: selectedProduct,
      price: selectedPrice,
      quantity: 1,
      total: selectedPrice
    };
    setRows(updatedRows);
  };

  const handlePriceChange = (price, rowIndex) => {
    const numericPrice = parseFloat(price) || 0;
    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        // Clear product when price changes
        return {
          ...row,
          price: numericPrice,
          product: null,
          quantity: 0,
          total: 0
        };
      }
      return row;
    });
    setRows(updatedRows);
  };

  const handleQuantityChange = (quantity, rowIndex) => {
    const numericQuantity = parseInt(quantity) || 0;
    const currentRow = rows[rowIndex];

    if (!currentRow.product) return;

    // Get total available stock for this product
    const availableStock = products
      .filter(p => p.name === currentRow.product.name)
      .reduce((total, p) => total + (parseInt(p.currentStock) || 0), 0);

    console.log(`Quantity check for ${currentRow.product.name}:`, {
      requestedQuantity: numericQuantity,
      availableStock: availableStock,
      matchingProducts: products.filter(p => p.name === currentRow.product.name)
    });

    if (numericQuantity > availableStock) {
      setQuantityError(`পরিমাণ অতিরিক্ত! ${currentRow.product.name} এর সর্বোচ্চ ${availableStock} পরিমাণ উপলব্ধ।`);
      Alert.alert('পরিমাণ অতিরিক্ত', `${currentRow.product.name} এর সর্বোচ্চ ${availableStock} পরিমাণ উপলব্ধ।`);
      return;
    }

    const updatedRows = rows.map((row, index) => {
      if (index === rowIndex) {
        return {
          ...row,
          quantity: numericQuantity,
          total: row.price * numericQuantity
        };
      }
      return row;
    });

    setRows(updatedRows);
    setQuantityError('');
  };

  const calculateTotal = (rowIndex) => {
    const row = rows[rowIndex];
    return row.price * row.quantity;
  };

  const calculateGrandTotal = () => {
    const normalTotal = rows.reduce((acc, row) =>
      acc + (row.product ? row.price * row.quantity : 0), 0);
    const returnTotal = returnProducts.reduce((acc, item) =>
      acc + (item.price * item.quantity), 0);
    return normalTotal - returnTotal;
  };

  const calculateCurrentDue = () => {
    const grandTotal = calculateGrandTotal();
    return previousDue + grandTotal - deposit;
  };

  // Function to convert number to Bangla words
  const numberToBanglaWords = (number) => {
    // This is a simplified implementation - you might want to use a more comprehensive library
    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোল', 'সতেরো', 'আঠারো', 'উনিশ'];
    const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

    if (number === 0) return 'শূন্য';

    if (number < 0) {
      return 'ঋণাত্মক ' + numberToBanglaWords(Math.abs(number));
    }

    let result = '';

    // Handle thousands
    if (number >= 1000) {
      result += numberToBanglaWords(Math.floor(number / 1000)) + ' হাজার ';
      number %= 1000;
    }

    // Handle hundreds
    if (number >= 100) {
      result += units[Math.floor(number / 100)] + ' শত ';
      number %= 100;
    }

    // Handle tens and units
    if (number > 0) {
      if (number < 10) {
        result += units[number];
      } else if (number < 20) {
        result += teens[number - 10];
      } else {
        result += tens[Math.floor(number / 10)];
        if (number % 10 > 0) {
          result += ' ' + units[number % 10];
        }
      }
    }

    return result.trim();
  };

  // Get description in Bangla words
  const getDescriptionInBanglaWords = () => {
    const grandTotal = calculateGrandTotal();
    return numberToBanglaWords(grandTotal) + ' টাকা মাত্র';
  };

  const saveInvoice = async () => {
    try {
      if (!name) {
        Alert.alert('ত্রুটি', 'গ্রাহকের নাম দিন');
        return;
      }

      const filledRows = rows.filter(row => row.product !== null && row.quantity > 0);
      if (filledRows.length === 0) {
        Alert.alert('ত্রুটি', 'কমপক্ষে একটি পণ্য নির্বাচন করুন');
        return;
      }

      // Get current user data for notification
      const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      const userData = JSON.parse(userDataStr);

      // First check if all products have sufficient stock
      for (const row of filledRows) {
        if (row.product && row.quantity > 0) {
          try {
            // Instead of checking individual product stock, check the total available stock
            // for products with the same name (like we do in handleQuantityChange)
            const productName = row.product.name;
            const availableStock = products
              .filter(p => p.name === productName)
              .reduce((total, p) => total + (parseInt(p.currentStock) || 0), 0);

            console.log(`${productName} - Total available stock across all products: ${availableStock}, Requested: ${row.quantity}`);

            if (availableStock < row.quantity) {
              Alert.alert(
                'পর্যাপ্ত স্টক নেই',
                `${productName}: বর্তমান স্টক ${availableStock}, আপনি বিক্রি করতে চাচ্ছেন ${row.quantity}`
              );
              return;
            }

            // Also check the specific product's stock as a backup
            const result = await productService.getProduct(row.product.id);
            console.log(`Checking specific product stock for ${productName}:`, result);

            if (result.success && result.data) {
              const productData = result.data;
              const specificStock = productData.currentStock || 0;
              console.log(`${productName} (ID: ${row.product.id}) - Specific stock: ${specificStock}`);

              // We'll continue even if the specific product has insufficient stock
              // as long as the total stock for this product name is sufficient
            }
          } catch (error) {
            console.error(`Error checking stock for ${row.product.name}:`, error);
            Alert.alert('ত্রুটি', `${row.product.name}: স্টক চেক করতে সমস্যা হয়েছে`);
            return;
          }
        }
      }

      // If all stock checks pass, proceed with updates
      for (const row of filledRows) {
        if (row.product && row.quantity > 0) {
          try {
            // Get all products with the same name
            const productsWithSameName = products.filter(p => p.name === row.product.name);
            console.log(`Found ${productsWithSameName.length} products with name ${row.product.name}`);

            // If there's only one product or the specific product has enough stock, update it directly
            const specificProduct = await productService.getProduct(row.product.id);

            if (specificProduct.success &&
                specificProduct.data &&
                specificProduct.data.currentStock >= row.quantity) {

              console.log(`Updating stock for specific product ${row.product.name} (ID: ${row.product.id})`);

              // Update product stock in Firebase
              const result = await productService.updateProductStock(
                row.product.id,
                row.quantity,
                'out',
                'Sale through invoice',
                userData?.email || 'unknown'
              );

              if (!result.success) {
                Alert.alert('ত্রুটি', `${row.product.name}: ${result.error}`);
                return;
              }
            }
            // If the specific product doesn't have enough stock but there are other products with the same name
            else if (productsWithSameName.length > 1) {
              console.log(`Specific product doesn't have enough stock, distributing across multiple products`);

              // Sort products by stock (highest first) to use up products with more stock first
              productsWithSameName.sort((a, b) => (b.currentStock || 0) - (a.currentStock || 0));

              let remainingQuantity = row.quantity;

              // Distribute the quantity across multiple products with the same name
              for (const product of productsWithSameName) {
                if (remainingQuantity <= 0) break;

                const availableStock = product.currentStock || 0;
                if (availableStock <= 0) continue;

                const quantityToDeduct = Math.min(availableStock, remainingQuantity);

                console.log(`Updating stock for ${product.name} (ID: ${product.id}), deducting ${quantityToDeduct} from ${availableStock}`);

                const result = await productService.updateProductStock(
                  product.id,
                  quantityToDeduct,
                  'out',
                  'Sale through invoice',
                  userData?.email || 'unknown'
                );

                if (!result.success) {
                  Alert.alert('ত্রুটি', `${product.name}: ${result.error}`);
                  return;
                }

                remainingQuantity -= quantityToDeduct;
              }

              if (remainingQuantity > 0) {
                Alert.alert('ত্রুটি', `${row.product.name}: পর্যাপ্ত স্টক নেই`);
                return;
              }
            }
            // If there's only one product but it doesn't have enough stock
            else {
              Alert.alert('ত্রুটি', `${row.product.name}: পর্যাপ্ত স্টক নেই`);
              return;
            }
          } catch (error) {
            console.error(`Error updating stock for ${row.product.name}:`, error);
            Alert.alert('ত্রুটি', `${row.product.name}: স্টক আপডেট করতে সমস্যা হয়েছে`);
            return;
          }
        }
      }

      const { number, formatted } = await getNextInvoiceNumber();
      await updateInvoiceCounter(number);

      const invoice = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        banglaDate: date || formatToBanglaDate(new Date()),
        serialNumber: formatted,
        customerName: name,
        items: filledRows.map(row => ({
          productId: row.product.id,
          productName: row.product.name,
          price: row.price,
          quantity: row.quantity,
          total: row.price * row.quantity,
          priceType: priceType // Add price type (wholesale or retail)
        })),
        returnItems: returnProducts.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          isReturn: true
        })),
        grandTotal: calculateGrandTotal(),
        previousDue: previousDue,
        deposit: deposit,
        currentDue: calculateCurrentDue(),
        description: description || getDescriptionInBanglaWords(),
        hasReturns: returnProducts.length > 0
      };

      // Save invoice to local storage
      const allInvoices = await fetchInvoices();
      allInvoices.push(invoice);
      await SecureStore.setItemAsync(INVOICES_STORAGE_KEY, JSON.stringify(allInvoices));

      // Save sale to Firebase
      const totalQuantity = filledRows.reduce((total, row) => total + row.quantity, 0);
      const returnTotalQuantity = returnProducts.reduce((total, item) => total + item.quantity, 0);
      const saleData = {
        staffEmail: userData.email,
        staffName: userData.email.split('@')[0],
        customerName: name,
        totalQuantity: totalQuantity,
        returnQuantity: returnTotalQuantity,
        totalAmount: calculateGrandTotal(),
        products: filledRows.map(row => ({
          productId: row.product.id,
          productName: row.product.name,
          price: row.price,
          quantity: row.quantity,
          total: row.price * row.quantity,
          priceType: priceType // Add price type (wholesale or retail)
        })),
        returnProducts: returnProducts.map(item => ({
          productId: item.productId,
          productName: item.productName,
          price: -Math.abs(item.price), // Make price negative to indicate return
          quantity: item.quantity,
          total: -Math.abs(item.price * item.quantity), // Make total negative
          isReturn: true
        })),
        previousDue: previousDue,
        deposit: deposit,
        currentDue: calculateCurrentDue(),
        hasReturns: returnProducts.length > 0
      };

      // Save to Firebase sales collection
      const saleResult = await salesService.addSale(saleData);

      if (!saleResult.success) {
        console.error('Error saving sale to Firebase:', saleResult.error);
        // Continue anyway since we've already saved to local storage
      }

      // We no longer need to save return products here as they are already saved in the ReturnProductModal
      // This prevents duplicate entries

      // Update invoiceData state
      setInvoiceData(invoice);
      setRows(initialRows);
      setPreviousDue(0);
      setDeposit(0);
      setDescription('');
      setDate(formatToBanglaDate(new Date()));
      setName('');
      setReturnProducts([]); // Reset return products after saving

      // Get and set new invoice number
      const nextInvoice = await getNextInvoiceNumber();
      setSerialNumber(nextInvoice.formatted);

      Alert.alert('সফল', 'ইনভয়েস সংরক্ষণ করা হয়েছে!');

      return invoice;
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('ত্রুটি', 'ইনভয়েস সংরক্ষণ করতে সমস্যা হয়েছে।');
      return null;
    }
  };

  // render past due input field in the invoice
  const handleShowAddInvoice = () => {
    setShowAddInvoice(!showAddInvoice);
  };

  // Function to handle return products from modal
  const handleReturnProducts = async (returnData) => {
    console.log('Return data received:', returnData);

    try {
      // Store the return products in state
      setReturnProducts(returnData.items);

      // Save return products to local storage for record keeping
      const storedReturns = await SecureStore.getItemAsync(RETURNED_PRODUCTS_KEY);
      const returnStock = storedReturns ? JSON.parse(storedReturns) : [];

      const newReturnEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        customerName: name,
        items: returnData.items,
        totalAmount: returnData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      };

      returnStock.push(newReturnEntry);
      await SecureStore.setItemAsync(RETURNED_PRODUCTS_KEY, JSON.stringify(returnStock));

      // Close the modal
      setReturnModalVisible(false);

      // Show success message
      Alert.alert('সফল', 'ফেরত পণ্য যোগ করা হয়েছে!');
    } catch (error) {
      console.error('Error processing return products:', error);
      Alert.alert('ত্রুটি', 'ফেরত পণ্য প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    }
  };



  const handleDownload = async () => {
    try {
      if (!name) {
        Alert.alert('ত্রুটি', 'গ্রাহকের নাম দিন');
        return;
      }

      const filledRows = rows.filter(row => row.product !== null && row.quantity > 0);
      if (filledRows.length === 0) {
        Alert.alert('ত্রুটি', 'কমপক্ষে একটি পণ্য নির্বাচন করুন');
        return;
      }

      // Save invoice first
      await saveInvoice();

      // Define HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                font-size: 14px;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
              }
              .total {
                text-align: right;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>কাসেম গার্মেন্টস</h1>
              <p>ইনভয়েস নং: ${serialNumber}</p>
              <p>তারিখ: ${date}</p>
              <p>গ্রাহকের নাম: ${name}</p>
            </div>
            <table>
              <tr>
                <th>নং</th>
                <th>বিবরণ</th>
                <th>মূল্য</th>
                <th>পরিমাণ</th>
                <th>মোট</th>
                <th>ধরন</th>
              </tr>
              ${filledRows.map((row, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${row.product.name}</td>
                  <td>${row.price}</td>
                  <td>${row.quantity}</td>
                  <td>${row.price * row.quantity}</td>
                  <td style="color: ${priceType === 'wholesale' ? '#4CAF50' : '#FF9800'}; font-weight: bold;">
                    ${priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা'}
                  </td>
                </tr>
              `).join('')}
              ${returnProducts.length > 0 ? `
                <tr>
                  <td colspan="6" style="background-color: #ffebee; color: #c62828; font-weight: bold;">
                    ফেরত পণ্য
                  </td>
                </tr>
                ${returnProducts.map((item, index) => `
                  <tr style="background-color: #ffebee; color: #c62828;">
                    <td>${filledRows.length + index + 1}</td>
                    <td>${item.productName}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                    <td style="color: #c62828; font-weight: bold;">-${Math.abs(item.price * item.quantity)}</td>
                    <td style="color: ${priceType === 'wholesale' ? '#4CAF50' : '#FF9800'}; font-weight: bold;">
                      ${priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা'}
                    </td>
                  </tr>
                `).join('')}
              ` : ''}
            </table>
            <div class="total">
              <p>সর্বমোট: ${calculateGrandTotal()} টাকা</p>
              ${previousDue > 0 ? `<p>পূর্বের বাকি: ${previousDue} টাকা</p>` : ''}
              <p>জমা: ${deposit} টাকা</p>
              <p>বাকি: ${calculateCurrentDue()} টাকা</p>
              <p>কথায়: ${description || getDescriptionInBanglaWords()}</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'ইনভয়েস শেয়ার করুন',
        UTI: 'com.adobe.pdf'
      });

    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('ত্রুটি', 'ইনভয়েস প্রক্রিয়া করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        {quantityError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{quantityError}</Text>
          </View>
        ) : null}

        <View style={styles.headerInputsContainer}>
          <View style={styles.inputDiv}>
            <Text style={styles.label}>ক্রমিক নং:</Text>
            <TextInput
              editable={false}
              style={styles.input}
              value={serialNumber}
              onChangeText={setSerialNumber}
            />
          </View>
          <View style={styles.inputDiv}>
            <Text style={styles.label}>নাম</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.inputDiv}>
            <Text style={styles.label}>তারিখ</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateText}>{date}</Text>
              </View>
            </TouchableOpacity>

            {/* Move Calendar component here */}
            <Calendar
              visible={showDatePicker}
              onSelectDate={handleDateSelect}
              onClose={() => setShowDatePicker(false)}
            />
          </View>
        </View>

        <View style={styles.priceTypeContainer}>
          <TouchableOpacity
            style={[
              styles.priceTypeButton,
              priceType === 'wholesale' && styles.activePriceType
            ]}
            onPress={() => {
              setPriceType('wholesale');
              // Clear selected products when changing price type
              setRows(rows.map(row => ({ ...row, product: null, price: '', quantity: 0 })));
            }}
          >
            <Text style={[
              styles.priceTypeText,
              priceType === 'wholesale' && { color: 'white' }
            ]}>পাইকারি মূল্য</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.priceTypeButton,
              priceType === 'retail' && styles.activePriceType
            ]}
            onPress={() => {
              setPriceType('retail');
              // Clear selected products when changing price type
              setRows(rows.map(row => ({ ...row, product: null, price: '', quantity: 0 })));
            }}
          >
            <Text style={[
              styles.priceTypeText,
              priceType === 'retail' && { color: 'white' }
            ]}>খুচরা মূল্য</Text>
          </TouchableOpacity>
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
              <Text style={styles.slCell}>{convertToBanglaNumeral(index + 1)}</Text>
              <View style={styles.productCell}>
                <TouchableOpacity 
                  style={styles.productSelector}
                  onPress={() => {
                    // You can add modal or better picker here if needed
                  }}
                >
                  <Text style={styles.productSelectorText}>
                    {row.product ? row.product.name : 'পণ্য নির্বাচন করুন'}
                  </Text>
                  <Icon name="chevron-down" style={styles.chevronIcon} />
                </TouchableOpacity>
                <Picker
                  selectedValue={row.product ? row.product.id : ''}
                  style={styles.hiddenPicker}
                  onValueChange={(itemValue) => {
                    if (itemValue) {
                      const selectedProduct = products.find(p => p.id === itemValue);
                      if (selectedProduct) {
                        const selectedPrice = priceType === 'wholesale' ?
                          parseFloat(selectedProduct.wholesalePrice) :
                          parseFloat(selectedProduct.retailPrice);
                        
                        const updatedRows = [...rows];
                        updatedRows[index] = {
                          ...updatedRows[index],
                          product: selectedProduct,
                          price: selectedPrice,
                          quantity: 1,
                          total: selectedPrice
                        };
                        setRows(updatedRows);
                      }
                    }
                  }}
                >
                  <Picker.Item label="পণ্য নির্বাচন করুন" value="" />
                  {products
                    .filter(product => product.currentStock > 0)
                    .map((product) => (
                      <Picker.Item
                        key={product.id}
                        label={`${product.name} (স্টক: ${product.currentStock})`}
                        value={product.id}
                      />
                    ))
                  }
                </Picker>
              </View>
              <View style={styles.cell}>
                <TextInput
                  style={styles.priceInput}
                  value={row.price.toString()}
                  onChangeText={(text) => handlePriceChange(text, index)}
                  keyboardType="numeric"
                  placeholder="মূল্য"
                  editable={false}
                />
              </View>
              <TextInput
                style={styles.quantityInput}
                value={row.quantity.toString()}
                onChangeText={(text) => handleQuantityChange(text, index)}
                keyboardType="numeric"
                maxLength={2}
                editable={row.product !== null}
              />
              <Text style={styles.cell}>{convertToBanglaNumeral(calculateTotal(index))} টাকা</Text>
            </View>
          ))}

          {/* Add a separator if there are return products */}
          {returnProducts.length > 0 && (
            <View style={styles.returnSeparator}>
              <Text style={styles.returnLabel}>ফেরত পণ্য</Text>
            </View>
          )}

          {/* Render return product rows */}
          {returnProducts.map((row, index) => (
            <View style={[styles.row, styles.returnRow]} key={row.id}>
              <Text style={styles.cell}>{convertToBanglaNumeral(rows.length + index + 1)}</Text>
              <View style={styles.productCell}>
                <Text style={[styles.productName, styles.returnText]}>{row.productName}</Text>
              </View>
              <Text style={[styles.cell, styles.returnText]}>{convertToBanglaNumeral(row.price)}</Text>
              <Text style={[styles.cell, styles.returnText]}>{convertToBanglaNumeral(row.quantity)}</Text>
              <Text style={[styles.cell, styles.returnText]}>{convertToBanglaNumeral(row.total)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={addNewRow}>
                <View style={styles.plusiconContainer}>
                  <Icon name="plus" style={styles.buttonIcon} />
                </View>
                <Text style={styles.buttonText}>নতুন পণ্য</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setReturnModalVisible(true)} // This opens the modal
              >
                <View style={styles.plusiconContainer}>
                  <Icon name="plus" style={styles.buttonIcon} />
                </View>
                <Text style={styles.buttonText}>ফেরত পণ্য</Text>
              </TouchableOpacity>

              <ReturnProductModal
                data={data}
                setData={setData}
                visible={returnModalVisible}
                onClose={() => setReturnModalVisible(false)}
                products={products}
                customerName={name}
                onSaveReturns={handleReturnProducts}
                priceType={priceType} // Add this prop
              />
              <TouchableOpacity style={styles.button} onPress={handleShowAddInvoice}>
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
              <Text style={styles.totalValue}>{convertToBanglaNumeral(calculateGrandTotal())} টাকা</Text>
            </View>
          </View>

          {showAddInvoice && (
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>পূর্বের বাকি</Text>
              <TextInput
                style={styles.accountInput}
                value={previousDue.toString()}
                onChangeText={(text) => setPreviousDue(parseInt(text) || 0)}
                keyboardType="numeric"
              />
              <Text style={styles.accountValueUnit}>টাকা</Text>
            </View>
          )}
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>জমা</Text>
            <TextInput
              style={styles.accountInput}
              value={deposit.toString()}
              onChangeText={(text) => setDeposit(parseInt(text) || 0)}
              keyboardType="numeric"
            />
            <Text style={styles.accountValueUnit}>টাকা</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>বাকি</Text>
            <Text style={styles.accountValue}>{convertToBanglaNumeral(calculateCurrentDue())} টাকা</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>কথায়</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder={getDescriptionInBanglaWords()}
              placeholderTextColor="#888"
            />
          </View>

          {/* Buttons Container */}
          <View style={{
            marginVertical: mS(15),
            marginHorizontal: mS(15),
          }}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveInvoice}
            >
              <Icon name="save" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>সংরক্ষণ করুন</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleDownload}
            >
              <Icon name="download" style={styles.saveButtonIcon} />
              <Text style={styles.saveButtonText}>ডাউনলোড করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: mS(5),
  },
  headerInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mS(15),
  },
  inputDiv: {
    marginBottom: mS(14),
  },
  label: {
    fontSize: mS(14),
    color: 'black',
    fontWeight: '500',
    marginBottom: mS(4),
  },
  input: {
    fontSize: mS(14),
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: mS(10),
    paddingVertical: mS(12),
    width: '100%',
    backgroundColor: 'white',
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
  slCell: {
    flex: 0.5,
    padding: mS(8),
    textAlign: 'center',
    borderWidth: 1,
    fontSize: mS(14),
    borderColor: '#ddd',
  },
  cell: {
    flex: 1,
    padding: mS(8),
    textAlign: 'center',
    borderWidth: 1,
    fontSize: mS(14),
    borderColor: '#ddd',
  },
  productCell: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  productSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: mS(8),
    paddingVertical: mS(12),
    backgroundColor: 'white',
    minHeight: mS(45),
  },
  productSelectorText: {
    flex: 1,
    fontSize: mS(12),
    color: '#333',
    fontWeight: '500',
  },
  chevronIcon: {
    fontSize: mS(14),
    color: '#666',
    marginLeft: mS(4),
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  productName: {
    flex: 1,
    fontSize: mS(14),
    padding: mS(6),
    textAlign: 'center',
    color: '#666'
  },
  quantityInput: {
    flex: 1,
    padding: mS(5),
    margin: mS(5),
    fontSize: mS(15),
    textAlign: 'center',
    borderColor: '#ddd',
  },
  priceInput: {
    flex: 1,
    padding: mS(5),
    fontSize: mS(15),
    textAlign: 'center',
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
    width: '28%',
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
    alignItems: 'center',
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
  accountInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: mS(14),
    paddingLeft: mS(10),
  },
  accountValueUnit: {
    textAlign: 'right',
    fontSize: mS(14),
    paddingLeft: mS(10),
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: mS(5),
    marginBottom: mS(10),
  },
  saveButtonText: {
    color: 'white',
    fontSize: mS(16),
    fontWeight: 'bold',
  },
  saveButtonIcon: {
    color: 'white',
    marginRight: mS(5),
    fontSize: mS(18)
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
  dateIcon: {
    fontSize: mS(16),
    color: '#666',
    marginRight: mS(8),
  },
  dateText: {
    fontSize: mS(14),
    fontWeight: '600',
    color: '#333',
  },
  returnSeparator: {
    backgroundColor: '#ffebee',
    padding: mS(8),
    borderBottomWidth: 1,
    borderBottomColor: '#ef5350',
  },
  returnLabel: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: mS(14),
    textAlign: 'center',
  },
  returnRow: {
    backgroundColor: '#ffebee',
  },
  returnText: {
    color: '#c62828',
  },
  priceTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: mS(20),
    gap: mS(20),
  },
  priceTypeButton: {
    paddingVertical: mS(12),
    paddingHorizontal: mS(20),
    borderRadius: mS(5),
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  activePriceType: {
    backgroundColor: '#4caf50',
    fontWeight: '600',
  },
  priceTypeText: {
    fontSize: mS(16),
    fontWeight: '600',
    color: '#333',
  }
});

export default InvoiceTable;
