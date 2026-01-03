import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ScrollView, Platform } from "react-native";
import { rS, vS, mS } from "@/style/responsive";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from 'expo-media-library';
import { SafeAreaView } from "react-native-safe-area-context";
import { notificationService } from '../service/api/notification';
import { SECURE_STORE_KEYS, USER_ROLES } from '../config/auth';
import { salesService } from '../service/api/sales';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Import the collection name constant
const TODAY_SALES_COLLECTION = 'todaySales';

const INVOICES_STORAGE_KEY = "invoices_data";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // Track time left for reset

  // Function to calculate time left for reset
  const calculateTimeLeft = () => {
    const now = new Date();
    const nextReset = new Date();
    nextReset.setHours(24, 0, 0, 0); // Reset at midnight
    const diff = nextReset - now;
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft({ hours, minutes });
    } else {
      setTimeLeft(null);
    }
  };

  // Reset invoices every 24 hours
  useEffect(() => {
    const resetData = async () => {
      try {
        await SecureStore.deleteItemAsync(INVOICES_STORAGE_KEY);
        setInvoices([]);
        Alert.alert("তথ্য রিসেট হয়েছে", "সকল ইনভয়েস মুছে ফেলা হয়েছে।");
      } catch (error) {
        console.error("Error resetting data:", error);
      }
    };

    const now = new Date();
    const nextReset = new Date();
    nextReset.setHours(24, 0, 0, 0); // Reset at midnight
    const timeUntilReset = nextReset - now;

    const resetTimeout = setTimeout(() => {
      resetData();
    }, timeUntilReset);

    return () => clearTimeout(resetTimeout);
  }, []);

  // Update time left every minute
  useEffect(() => {
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch invoices from SecureStore when component mounts
  useFocusEffect(
    React.useCallback(() => {
      const fetchInvoices = async () => {
        try {
          setLoading(true);
          const storedInvoicesJson = await SecureStore.getItemAsync(
            INVOICES_STORAGE_KEY
          );

          if (storedInvoicesJson) {
            const storedInvoices = JSON.parse(storedInvoicesJson);
            setInvoices(storedInvoices);
            console.log("Invoices fetched from SecureStore:", storedInvoices);
          } else {
            console.log("No invoices found in SecureStore");
            setInvoices([]);
          }
        } catch (error) {
          console.error("Error fetching invoices from SecureStore:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoices();
    }, [])
  );

  const handleInvoicePress = (invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedInvoice(null);
  };

  const deleteInvoice = async (invoiceId) => {
    Alert.alert(
      "নিশ্চিত করুন",
      "আপনি কি এই ইনভয়েসটি মুছে ফেলতে চান?",
      [
        {
          text: "বাতিল",
          style: "cancel"
        },
        {
          text: "মুছে ফেলুন",
          style: "destructive",
          onPress: async () => {
            try {
              // Filter out the selected invoice
              const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);

              // Save the updated list back to SecureStore
              await SecureStore.setItemAsync(
                INVOICES_STORAGE_KEY,
                JSON.stringify(updatedInvoices)
              );

              // Update state
              setInvoices(updatedInvoices);

              // Close modal if open
              if (modalVisible && selectedInvoice?.id === invoiceId) {
                closeModal();
              }

              Alert.alert("সফল", "ইনভয়েস মুছে ফেলা হয়েছে!");
            } catch (error) {
              console.error("Error deleting invoice:", error);
              Alert.alert("ত্রুটি", "ইনভয়েস মুছে ফেলতে সমস্যা হয়েছে!");
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  // Function to save an invoice and create a notification log
  const saveInvoice = async (invoiceData) => {
    try {
      const userDataStr = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      const userData = JSON.parse(userDataStr);

      // Save the invoice
      const storedInvoicesJson = await SecureStore.getItemAsync(INVOICES_STORAGE_KEY);
      const storedInvoices = storedInvoicesJson ? JSON.parse(storedInvoicesJson) : [];
      const updatedInvoices = [...storedInvoices, invoiceData];
      await SecureStore.setItemAsync(INVOICES_STORAGE_KEY, JSON.stringify(updatedInvoices));

      // Save to Firebase todaySales collection
      const saleData = {
        staffEmail: userData.email,
        staffName: userData.name || userData.email,
        isAdmin: userData.role === USER_ROLES.ADMIN,
        customerName: invoiceData.customerName || "অজানা গ্রাহক",
        products: invoiceData.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        returnProducts: invoiceData.returnItems ? invoiceData.returnItems.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })) : [],
        totalQuantity: invoiceData.items.reduce((total, item) => total + parseInt(item.quantity || 0), 0),
        totalAmount: invoiceData.items.reduce((total, item) => total + (item.total || 0), 0),
        previousDue: invoiceData.previousDue || 0,
        deposit: invoiceData.deposit || 0,
        currentDue: invoiceData.currentDue || 0,
        slNumber: parseInt(invoiceData.serialNumber) || 0,
        serialNumber: invoiceData.serialNumber, // Keep both for compatibility
        date: new Date(),
        createdAt: new Date()
      };

      // Save directly to today's sales collection instead of using salesService
      // This ensures we keep the original serialNumber
      const todaySalesRef = collection(db, TODAY_SALES_COLLECTION);
      await addDoc(todaySalesRef, {
        ...saleData,
        // Make sure we preserve the original serialNumber as a string
        serialNumber: invoiceData.serialNumber,
        // Keep slNumber as a number for compatibility
        slNumber: parseInt(invoiceData.serialNumber) || 0,
        createdAt: new Date()
      });

      // Create notification log
      await notificationService.createLog({
        action: 'sale',
        by: userData.email,
        productName: invoiceData.items.map(item => `${item.productName} (${item.quantity})`).join(', '),
        quantity: invoiceData.items.reduce((total, item) => total + parseInt(item.quantity || 0), 0),
        amount: invoiceData.items.reduce((total, item) => total + (item.total || 0), 0),
        customerName: invoiceData.customerName || "অজানা গ্রাহক"
      });

      return true;
    } catch (error) {
      console.error('Error saving invoice:', error);
      return false;
    }
  };

  // Function to download all invoices as a single PDF
  const downloadAllInvoices = async () => {
    if (invoices.length === 0) {
      Alert.alert('কোন ডাটা নেই', 'ডাউনলোড করার জন্য কোন ইনভয়েস পাওয়া যায়নি।');
      return;
    }

    try {
      // Generate PDF content with all invoices
      let htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Arial'; padding: 20px; direction: ltr; }
              h1 { color: #4caf50; text-align: center; }
              h2 { color: #2196F3; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #4caf50; color: white; }
              .footer { margin-top: 15px; text-align: right; border-top: 1px dashed #ccc; padding-top: 10px; }
              .invoice-container { margin-bottom: 40px; page-break-after: always; }
              .summary-table { margin-top: 40px; width: 100%; border-collapse: collapse; }
              .summary-header { background-color: #2196F3; color: white; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>সকল ইনভয়েস</h1>
            <p style="text-align: center;">মোট ইনভয়েস: ${invoices.length}টি</p>
      `;

      // First add a summary table of all invoices
      htmlContent += `
        <table class="summary-table">
          <tr class="summary-header">
            <th>ক্রমিক</th>
            <th>তারিখ</th>
            <th>গ্রাহকের নাম</th>
            <th>পণ্যের সংখ্যা</th>
            <th>মোট মূল্য</th>
            <th>বাকি</th>
          </tr>
      `;

      let totalAmount = 0;
      let totalDue = 0;

      // Add each invoice to the summary table
      invoices.forEach((invoice, index) => {
        const grandTotal = invoice.items.reduce((total, item) => total + item.total, 0);
        const currentDue = invoice.currentDue || 0;
        totalAmount += grandTotal;
        totalDue += currentDue;

        htmlContent += `
          <tr>
            <td>${invoice.serialNumber || index + 1}</td>
            <td>${invoice.banglaDate || formatDate(invoice.date)}</td>
            <td>${invoice.customerName || "অজানা"}</td>
            <td>${invoice.items.length}</td>
            <td>${grandTotal} টাকা</td>
            <td>${currentDue > 0 ? currentDue + ' টাকা' : '-'}</td>
          </tr>
        `;
      });

      // Add summary totals
      htmlContent += `
          <tr style="font-weight: bold; background-color: #f5f5f5;">
            <td colspan="4" style="text-align: right;">সর্বমোট:</td>
            <td>${totalAmount} টাকা</td>
            <td>${totalDue} টাকা</td>
          </tr>
        </table>
        <hr style="margin: 40px 0;">
      `;

      // Add each invoice in detail
      invoices.forEach((invoice, index) => {
        const grandTotal = invoice.items.reduce((total, item) => total + item.total, 0);
        const previousDue = invoice.previousDue || 0;
        const deposit = invoice.deposit || 0;
        const currentDue = invoice.currentDue || (grandTotal + previousDue - deposit);

        htmlContent += `
          <div class="invoice-container">
            <h2>ইনভয়েস #${invoice.serialNumber || index + 1}</h2>
            <div class="header">
              <p>গ্রাহক: ${invoice.customerName || "গ্রাহক"}</p>
              <p>সিরিয়াল: ${invoice.serialNumber || "---"}</p>
              <p>তারিখ: ${invoice.banglaDate || formatDate(invoice.date)}</p>
            </div>
            <table>
              <tr>
                <th>নং</th>
                <th>পণ্যের বিবরণ</th>
                <th>পরিমাণ</th>
                <th>মূল্য</th>
                <th>মোট</th>
              </tr>
        `;

        // Add product rows for this invoice
        invoice.items.forEach((item, itemIndex) => {
          htmlContent += `
            <tr>
              <td>${itemIndex + 1}</td>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>${item.price} টাকা</td>
              <td>${item.total} টাকা</td>
            </tr>
          `;
        });

        // Add return products if any
        if (invoice.returnItems && invoice.returnItems.length > 0) {
          htmlContent += `
            <tr>
              <td colspan="5" style="background-color: #ffebee; color: #c62828; font-weight: bold; text-align: center;">
                ফেরত পণ্য
              </td>
            </tr>
          `;

          invoice.returnItems.forEach((item, index) => {
            htmlContent += `
              <tr style="background-color: #ffebee; color: #c62828;">
                <td>${invoice.items.length + index + 1}</td>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>${Math.abs(item.price)} টাকা</td>
                <td style="font-weight: bold;">-${Math.abs(item.total)} টাকা</td>
              </tr>
            `;
          });
        }

        // Add total row and footer for this invoice
        htmlContent += `
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold;">সর্বমোট:</td>
                <td style="font-weight: bold;">${grandTotal} টাকা</td>
              </tr>
            </table>

            <div class="footer">
              <p>পূর্বের বাকি: ${previousDue} টাকা</p>
              <p>জমা: ${deposit} টাকা</p>
              <p>বর্তমান বাকি: ${currentDue} টাকা</p>
              <p>কথায়: ${invoice.description || ''}</p>
            </div>
          </div>
        `;

        // Don't add page break after the last invoice
        if (index < invoices.length - 1) {
          htmlContent += `<div style="page-break-after: always;"></div>`;
        }
      });

      // Close HTML
      htmlContent += `
          </body>
        </html>
      `;

      // Generate PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (Platform.OS === 'android') {
        try {
          // On Android, request permission to pick a directory to save the file
          console.log("Requesting directory permission...");
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (permissions.granted) {
            const date = new Date();
            const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            const pdfName = `All_Invoices_${formattedDate}.pdf`;
            console.log("Creating file:", pdfName);

            // Create the file in the selected directory
            const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              pdfName,
              'application/pdf'
            );

            console.log("File created at:", destinationUri);

            // Read the content of the generated PDF
            const fileContent = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64
            });

            console.log("Read file content, length:", fileContent.length);

            // Write the content to the new file
            await FileSystem.writeAsStringAsync(
              destinationUri,
              fileContent,
              { encoding: FileSystem.EncodingType.Base64 }
            );

            console.log("File written successfully");
            Alert.alert('সফল', 'সকল ইনভয়েসের পিডিএফ ডাউনলোড হয়েছে!');
          } else {
            console.log("Permission not granted");
            Alert.alert('অনুমতি নেই', 'ফাইল সংরক্ষণ করার জন্য আমাদের আপনার ডিভাইসে অনুমতি প্রয়োজন।');
          }
        } catch (error) {
          console.error('Download error:', error);
          Alert.alert('ত্রুটি', 'পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }
      } else {
        // For iOS, use Sharing
        try {
          await Sharing.shareAsync(uri, {
            UTI: 'com.adobe.pdf',
            mimeType: 'application/pdf'
          });
        } catch (error) {
          console.error('iOS download error:', error);
          Alert.alert('ত্রুটি', 'পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে।');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('ত্রুটি', 'পিডিএফ তৈরি করতে সমস্যা হয়েছে!');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Add this helper function
  const calculateTotalForInvoice = (invoice) => {
    if (!invoice || !Array.isArray(invoice.items)) {
      return 0;
    }
    return invoice.items.reduce((total, item) => total + (item?.total || 0), 0);
  };

  // Function to download a single invoice as PDF
const downloadInvoice = async (invoice) => {
  if (!invoice) {
    Alert.alert('ত্রুটি', 'ইনভয়েস ডাটা পাওয়া যায়নি।');
    return;
  }

  try {
    // Calculate totals
    const grandTotal = invoice.items.reduce((total, item) => total + item.total, 0);
    const previousDue = invoice.previousDue || 0;
    const deposit = invoice.deposit || 0;
    const currentDue = invoice.currentDue || (grandTotal + previousDue - deposit);

    // Generate PDF content for single invoice
    let htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Arial'; padding: 20px; direction: ltr; }
            h1 { color: #4caf50; text-align: center; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4caf50; color: white; }
            .footer { margin-top: 15px; text-align: right; border-top: 1px dashed #ccc; padding-top: 10px; }
            .company-info { text-align: center; margin-bottom: 20px; }
            .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .wholesale { color: #4CAF50; font-weight: bold; }
            .retail { color: #FF9800; font-weight: bold; }
            .current-due { color: #ff0000; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="company-info">
            <h1>ইনভয়েস</h1>
          </div>

          <div class="invoice-meta">
            <p><strong>গ্রাহক:</strong> ${invoice.customerName || "গ্রাহক"}</p>
            <p><strong>সিরিয়াল:</strong> ${invoice.serialNumber || "---"}</p>
            <p><strong>তারিখ:</strong> ${invoice.banglaDate || formatDate(invoice.date)}</p>
          </div>

          <table>
            <tr>
              <th>নং</th>
              <th>পণ্যের বিবরণ</th>
              <th>পরিমাণ</th>
              <th>মূল্য</th>
              <th>মোট</th>
              <th>ধরন</th>
            </tr>
    `;

    // Add product rows
    invoice.items.forEach((item, index) => {
      const priceType = item.priceType || 'wholesale'; // Default to wholesale if not specified
      const priceTypeText = priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা';
      const priceTypeColor = priceType === 'wholesale' ? '#4CAF50' : '#FF9800';

      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.productName}</td>
          <td>${item.quantity}</td>
          <td>${item.price} টাকা</td>
          <td>${item.total} টাকা</td>
          <td style="color: ${priceTypeColor}; font-weight: bold;">${priceTypeText}</td>
        </tr>
      `;
    });

    // Add return products if any
    if (invoice.returnItems && invoice.returnItems.length > 0) {
      htmlContent += `
        <tr>
          <td colspan="6" style="background-color: #ffebee; color: #c62828; font-weight: bold; text-align: center;">
            ফেরত পণ্য
          </td>
        </tr>
      `;

      invoice.returnItems.forEach((item, index) => {
        const priceType = item.priceType || 'wholesale'; // Default to wholesale if not specified
        const priceTypeText = priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা';
        const priceTypeColor = priceType === 'wholesale' ? '#4CAF50' : '#FF9800';

        htmlContent += `
          <tr style="background-color: #ffebee; color: #c62828;">
            <td>${invoice.items.length + index + 1}</td>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${Math.abs(item.price)} টাকা</td>
            <td style="font-weight: bold;">-${Math.abs(item.total)} টাকা</td>
            <td style="color: ${priceTypeColor}; font-weight: bold;">${priceTypeText}</td>
          </tr>
        `;
      });
    }

    // Add total row and footer
    htmlContent += `
          <tr>
            <td colspan="4" style="text-align: right; font-weight: bold;">সর্বমোট:</td>
            <td style="font-weight: bold;">${grandTotal} টাকা</td>
          </tr>
        </table>

        <div class="footer">
          <p><strong>পূর্বের বাকি:</strong> ${previousDue} টাকা</p>
          <p><strong>জমা:</strong> ${deposit} টাকা</p>
          <p><strong style="color: #ff0000;">বর্তমান বাকি:</strong> <span style="color: #ff0000; font-weight: bold;">${currentDue} টাকা</span></p>
          ${invoice.description ? `<p><strong>কথায়:</strong> ${invoice.description}</p>` : ''}
        </div>
      </body>
    </html>
    `;

    // Generate PDF from HTML
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    if (Platform.OS === 'android') {
      try {
        // Request permission to pick a directory to save the file
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          const date = new Date();
          const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
          const customerName = invoice.customerName ? invoice.customerName.replace(/\s+/g, '_') : 'Unknown';
          const pdfName = `Invoice_${customerName}_${formattedDate}.pdf`;

          // Create the file in the selected directory
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            pdfName,
            'application/pdf'
          );

          // Read the content of the generated PDF
          const fileContent = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64
          });

          // Write the content to the new file
          await FileSystem.writeAsStringAsync(
            destinationUri,
            fileContent,
            { encoding: FileSystem.EncodingType.Base64 }
          );

          Alert.alert('সফল', 'ইনভয়েস ডাউনলোড হয়েছে!');
        } else {
          Alert.alert('অনুমতি নেই', 'ফাইল সংরক্ষণ করার জন্য আমাদের আপনার ডিভাইসে অনুমতি প্রয়োজন।');
        }
      } catch (error) {
        console.error('Download error:', error);
        Alert.alert('ত্রুটি', 'পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } else {
      // For iOS, use Sharing
      try {
        await Sharing.shareAsync(uri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf'
        });
      } catch (error) {
        console.error('iOS download error:', error);
        Alert.alert('ত্রুটি', 'পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে।');
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert('ত্রুটি', 'পিডিএফ তৈরি করতে সমস্যা হয়েছে!');
  }
};

  // Render each invoice item
  const renderInvoiceItem = ({ item }) => {
    // Safely calculate grand total with null checks and ensure items array exists
    const items = item?.items || [];
    const returnItems = item?.returnItems || [];
    const hasReturns = returnItems.length > 0;

    // Calculate grand total (including returns)
    const grandTotal = items.reduce((total, product) => {
      return total + (product?.total || 0);
    }, 0) - returnItems.reduce((total, product) => {
      return total + Math.abs(product?.total || 0);
    }, 0);

    // Get date in readable format
    const dateString = formatDate(item.date || new Date());

    return (
      <TouchableOpacity style={styles.invoiceItem} onPress={() => handleInvoicePress(item)}>
        <View style={styles.invoiceHeader}>
          <Text style={styles.invoiceDate}>
            <Icon name="calendar" style={styles.aboutCardIcons} /> {item.banglaDate || dateString}
          </Text>
          <Text style={styles.invoiceCustomer}>
            <Icon name="user" style={styles.aboutCardIcons} /> {item.customerName || "গ্রাহক"}
          </Text>
          <Text style={styles.invoiceTotal}>
            <Icon name="money" style={styles.aboutCardIcons} /> {grandTotal} টাকা
          </Text>
        </View>

        <View style={styles.invoiceDetails}>
          <Text style={styles.invoiceItemsCount}>
            <Icon name="shopping-cart" style={styles.cartIcon} /> পণ্য: {items.length}টি
          </Text>
          {hasReturns && (
            <Text style={styles.returnItems}>
              <Icon name="reply" style={styles.returnIcon} /> ফেরত: {returnItems.length}টি
            </Text>
          )}
        </View>

        <View style={styles.invoiceDetails}>
          {/* Product Category */}
          <View style={styles.categoryContainer}>
            {items.some(product => product.priceType === 'wholesale') && (
              <Text style={styles.wholesaleText}>পাইকারি</Text>
            )}
            {items.some(product => product.priceType === 'retail') && (
              <Text style={styles.retailText}>খুচরা</Text>
            )}
          </View>

          {/* Current Due */}
          {item.currentDue > 0 && (
            <Text style={styles.invoiceDue}>
              <Icon name="exclamation-circle" style={styles.exclamationIcon}/> বর্তমান বাকি: {item.currentDue} টাকা
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.downloadButton} onPress={() => downloadInvoice(item)}>
            <Icon name="download" style={styles.DDbuttonIcons} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteInvoice(item.id)}>
            <Icon name="trash" style={styles.DDbuttonIcons} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render invoice detail modal
  const renderInvoiceDetailModal = () => {
    if (!selectedInvoice) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}> আজকের বিক্রি </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="times" style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.invoiceDetailHeader}>
                <Text style={styles.invoiceDetailDate}>
                  <Icon name="calendar" style={styles.icon} /> তারিখ: {selectedInvoice.banglaDate || formatDate(selectedInvoice.date)}
                </Text>
                <Text style={styles.invoiceDetailSerial}>
                  <Icon name="hashtag" style={styles.icon} /> ক্রমিক: {selectedInvoice.serialNumber || "---"}
                </Text>
              </View>
              <View style={styles.invoiceDetailHeader}>
                <Text style={styles.invoiceDetailCustomer}>
                  <Icon name="user" style={styles.icon} /> গ্রাহক: {selectedInvoice.customerName || "অজানা"}
                </Text>
                <Text style={styles.invoiceDetailId}>
                  <Icon name="barcode" style={styles.icon} /> আইডি: #{selectedInvoice.id.substring(0, 8)}
                </Text>
              </View>

              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>পণ্য তালিকা:</Text>

                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 0.5 }]}>নং</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>বিবরণ</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>পরিমাণ</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>মূল্য</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>মোট</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>ধরন</Text>
                </View>

                {/* Regular products */}
                {selectedInvoice.items.map((item, index) => (
                  <View key={`item-${index}`} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.productName}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.quantity}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.price} টাকা</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.total} টাকা</Text>
                    <Text style={[
                      styles.tableCell,
                      { flex: 1 },
                      item.priceType === 'wholesale' ? styles.wholesaleText : styles.retailText
                    ]}>
                      {item.priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা'}
                    </Text>
                  </View>
                ))}

                {/* Return products section */}
                {selectedInvoice.returnItems && selectedInvoice.returnItems.length > 0 && (
                  <>
                    <View style={styles.returnHeader}>
                      <Text style={styles.returnHeaderText}>ফেরত পণ্য</Text>
                    </View>
                    {selectedInvoice.returnItems.map((item, index) => (
                      <View key={`return-${index}`} style={[styles.tableRow, styles.returnRow]}>
                        <Text style={[styles.tableCell, styles.returnText, { flex: 0.5 }]}>
                          {selectedInvoice.items.length + index + 1}
                        </Text>
                        <Text style={[styles.tableCell, styles.returnText, { flex: 2 }]}>
                          {item.productName}
                        </Text>
                        <Text style={[styles.tableCell, styles.returnText, { flex: 1 }]}>
                          {item.quantity}
                        </Text>
                        <Text style={[styles.tableCell, styles.returnText, { flex: 1 }]}>
                          {Math.abs(item.price)} টাকা
                        </Text>
                        <Text style={[styles.tableCell, styles.returnText, { flex: 1 }]}>
                          -{Math.abs(item.total)} টাকা
                        </Text>
                        <Text style={[
                          styles.tableCell,
                          styles.returnText,
                          { flex: 1 },
                          item.priceType === 'wholesale' ? styles.wholesaleText : styles.retailText
                        ]}>
                          {item.priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা'}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>

              <View style={styles.invoiceSummary}>
                <Text style={styles.summaryTitle}>হিসাব সারাংশ:</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>সর্বমোট:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedInvoice.items.reduce((total, item) => total + item.total, 0)} টাকা
                  </Text>
                </View>

                {selectedInvoice.previousDue > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>পূর্বের বাকি:</Text>
                    <Text style={styles.summaryValue}>{selectedInvoice.previousDue} টাকা</Text>
                  </View>
                )}

                {selectedInvoice.deposit > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>জমা:</Text>
                    <Text style={styles.summaryValue}>{selectedInvoice.deposit} টাকা</Text>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>বর্তমান বাকি:</Text>
                  <Text style={[styles.summaryValue, styles.currentDueValue]}>
                    {selectedInvoice.currentDue} টাকা
                  </Text>
                </View>

                {selectedInvoice.description && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>কথায়:</Text>
                    <Text style={styles.descriptionValue}>{selectedInvoice.description}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.downloadButton]}
                onPress={() => downloadInvoice(selectedInvoice)}
              >
                <Icon name="download" style={styles.DDbuttonIcons} />
                <Text style={styles.buttonText}>ডাউনলোড করুন</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerButton, styles.deleteButton]}
                onPress={() => deleteInvoice(selectedInvoice.id)}
              >
                <Icon name="trash" style={styles.DDbuttonIcons} />
                <Text style={styles.buttonText}>মুছে ফেলুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            <Icon name="list-alt" style={styles.headerIcon} /> আজকের বিক্রি
          </Text>
          <Text style={styles.headerCount}>মোট: {invoices.length} টি</Text>
        </View>

        {invoices.length > 0 && (
          <TouchableOpacity
            style={styles.globalDownloadButton}
            onPress={downloadAllInvoices}
          >
            <Icon name="download" style={styles.globalDownloadIcon} />
            <Text style={styles.globalDownloadText}>সব ডাউনলোড</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Warning message */}
      {timeLeft && timeLeft.hours === 0 && timeLeft.minutes <= 60 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            সতর্কতা: ডেটা রিসেট হতে {timeLeft.minutes} মিনিট বাকি।
            অনুগ্রহ করে সকল ডেটা ডাউনলোড করুন।
          </Text>
        </View>
      )}

      {invoices.length > 0 ? (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="file-o" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>কোন ইনভয়েস পাওয়া যায়নি</Text>
        </View>
      )}

      {renderInvoiceDetailModal()}
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    backgroundColor: 'white',
    padding: mS(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: mS(12),
    paddingHorizontal: mS(10),
    marginBottom: mS(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: mS(18),
    fontWeight: 'bold',
    color: '#444',
    gap: mS(5),
  },
  headerIcon: {
    fontSize: mS(18),
    color: '#4caf50',
  },
  headerCount: {
    fontSize: mS(14),
    color: '#4caf50',
    fontWeight: '500',
  },
  globalDownloadButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: mS(8),
    paddingHorizontal: mS(12),
    borderRadius: mS(5),
  },
  globalDownloadText: {
    color: 'white',
    fontSize: mS(12),
    fontWeight: 'bold',
    marginLeft: mS(5),
  },
  listContainer: {
    paddingBottom: mS(100), // Increased bottom padding to make the last card fully visible
  },
  invoiceItem: {
    backgroundColor: 'white',
    borderRadius: mS(10),
    padding: mS(12),
    marginBottom: mS(10),
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mS(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: mS(8),
  },
  invoiceDate: {
    fontSize: mS(13),
    color: '#444',
    flex: 1,
  },
  invoiceCustomer: {
    fontSize: mS(13),
    color: '#444',
    flex: 1,
    textAlign: 'center',
  },
  invoiceTotal: {
    fontSize: mS(13),
    fontWeight: 'bold',
    color: '#444',
    flex: 1,
    textAlign: 'right',
  },
  aboutCardIcons: {
    fontSize: mS(14),
    color: '#4caf50',
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mS(10),
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: mS(10),
  },
  invoiceItemsCount: {
    fontSize: mS(13),
    color: '#666',
  },
  cartIcon: {
    fontSize: mS(15) ,
    color:"#555"
  },
  invoiceDue: {
    fontSize: mS(14),
    color: '#ff0000',
    fontWeight: 'bold',
  },
  returnItems: {
    fontSize: mS(13),
    color: '#c62828',
    marginLeft: mS(10),
  },
  returnIcon: {
    fontSize: mS(15),
    color: "#c62828"
  },
  exclamationIcon: {
    fontSize: mS(15),
    color: "#f44336"
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadButton: {
    backgroundColor: '#2196F3',
    paddingVertical: mS(10),
    paddingHorizontal: mS(12),
    borderRadius: mS(5),
    marginRight: mS(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingVertical: mS(10),
    paddingHorizontal: mS(12),
    borderRadius: mS(5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: mS(5),
    fontSize: mS(12),
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: mS(20),
  },
  emptyText: {
    marginTop: mS(10),
    color: '#888',
    fontSize: mS(16),
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: mS(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: mS(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  modalTitle: {
    fontSize: mS(18),
    fontWeight: 'bold',
    color: '#4caf50',
  },
  closeIcon: {
    fontSize: mS(20),
    color: '#555',
  },
  modalBody: {
    padding: mS(15),
    maxHeight: '70%',
  },
  invoiceDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mS(8),
    padding: mS(10),
    backgroundColor: '#f5f5f5',
    borderRadius: mS(5),
  },
  invoiceDetailDate: {
    fontSize: mS(14),
    color: '#444',
    flex: 1,
  },
  invoiceDetailSerial: {
    fontSize: mS(14),
    color: '#444',
    flex: 1,
    textAlign: 'right',
  },
  invoiceDetailCustomer: {
    fontSize: mS(14),
    color: '#444',
    flex: 1,
  },
  invoiceDetailId: {
    fontSize: mS(14),
    color: '#444',
    flex: 1,
    textAlign: 'right',
  },
  itemsContainer: {
    marginBottom: mS(20),
  },
  itemsTitle: {
    fontSize: mS(16),
    fontWeight: 'bold',
    color: '#444',
    marginBottom: mS(10),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    borderRadius: mS(5),
    overflow: 'hidden',
  },
  tableHeaderCell: {
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    padding: mS(8),
    fontSize: mS(13),
  },
  returnHeader: {
    backgroundColor: '#ffebee',
    padding: mS(8),
    marginTop: mS(10),
    borderRadius: mS(5),
  },
  returnHeaderText: {
    color: '#c62828',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: mS(14),
  },
  returnRow: {
    backgroundColor: '#ffebee',
  },
  returnText: {
    color: '#c62828',
    fontWeight: '500',
  },
  wholesaleText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  retailText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  invoiceSummary: {
    backgroundColor: '#f9f9f9',
    padding: mS(10),
    borderRadius: mS(5),
  },
  summaryTitle: {
    fontSize: mS(16),
    fontWeight: 'bold',
    color: '#444',
    marginBottom: mS(10),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mS(5),
    padding: mS(5),
  },
  summaryLabel: {
    fontSize: mS(14),
    color: '#555',
  },
  summaryValue: {
    fontSize: mS(14),
    fontWeight: 'bold',
    color: '#444',
  },
  currentDueValue: {
    color: '#ff0000',
    fontWeight: 'bold',
    fontSize: mS(15),
  },
  descriptionValue: {
    fontSize: mS(14),
    fontStyle: 'italic',
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: mS(15),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: mS(10),
    borderRadius: mS(5),
    marginHorizontal: mS(5),
  },
  icon: {
    fontSize: mS(15),
    color: "#4caf50"
  },
  globalDownloadIcon: {
    fontSize: mS(16),
    color: 'white',
  },
  emptyIcon: {
    fontSize: mS(35),
    color: '#ddd',
  },
  DDbuttonIcons: {
    fontSize: mS(16),
    color: 'white',
  },
  warningContainer: {
    backgroundColor: '#ffcc00',
    padding: mS(10),
    borderRadius: mS(5),
    marginBottom: mS(10),
  },
  warningText: {
    color: '#444',
    fontSize: mS(14),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default InvoiceList;