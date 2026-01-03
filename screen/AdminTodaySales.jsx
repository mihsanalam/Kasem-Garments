import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import LogoTitle from "@/components/inventory/LogoTitle";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { mS } from "../style/responsive";
import { salesService } from "../service/api/sales";
import { SECURE_STORE_KEYS, USER_ROLES } from '../config/auth';
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from 'expo-media-library';

const AdminTodaySalesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);

  // Helper function to convert numbers to Bengali
  const convertToBengaliNumber = (number) => {
    if (number === undefined || number === null) return "০";
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return number
      .toString()
      .split('')
      .map(digit => {
        if (digit >= '0' && digit <= '9') {
          return bengaliNumerals[parseInt(digit)];
        }
        return digit;
      })
      .join('');
  };

  // Get user data on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
        if (userData) {
          const { email, role } = JSON.parse(userData);
          setUserEmail(email);
          setUserRole(role);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };

    getUserData();
  }, []);

  // Fetch sales data when component is focused
  useFocusEffect(
    React.useCallback(() => {
      const fetchSalesData = async () => {
        try {
          setLoading(true);

          let sales = [];

          // If user is admin, get all today's sales
          if (userRole === USER_ROLES.ADMIN) {
            sales = await salesService.getAllTodaySales();
          } else {
            // If user is staff, only get their sales
            if (userEmail) {
              sales = await salesService.getTodaySalesByStaff(userEmail);
            }
          }

          if (sales && sales.length > 0) {
            processSalesData(sales);
          } else {
            setSalesData([]);
            setTotalAmount(0);
          }
        } catch (error) {
          console.error("Error fetching sales data:", error);
          Alert.alert("ত্রুটি", "বিক্রয় তথ্য লোড করতে সমস্যা হয়েছে");
          setSalesData([]);
          setTotalAmount(0);
        } finally {
          setLoading(false);
        }
      };

      if (userRole) {
        fetchSalesData();
      }
    }, [userRole, userEmail])
  );

  // Process sales data for display
  const processSalesData = (sales) => {
    let total = 0;

    // Process each sale
    const formattedSales = sales.map((sale, index) => {
      // Add to total amount
      total += sale.totalAmount || 0;

      // Format date
      const createdAt = sale.createdAt instanceof Date ? sale.createdAt : new Date();
      const formattedDate = `${createdAt.getDate().toString().padStart(2, '0')}-${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${createdAt.getFullYear()}`;
      const formattedTime = `${createdAt.getHours().toString().padStart(2, '0')}:${createdAt.getMinutes().toString().padStart(2, '0')}`;

      // Determine the original SL number
      // Always prioritize the serialNumber from the invoice
      // This is the actual SL number entered by the staff
      const originalSlNumber = sale.serialNumber || sale.slNumber || index + 1;

      // Determine price type (wholesale or retail) based on products
      // Default to wholesale if not specified
      const priceType = sale.priceType || 'wholesale';

      // Count wholesale and retail products
      const wholesaleCount = (sale.products || []).filter(p => p.priceType === 'wholesale').length;
      const retailCount = (sale.products || []).filter(p => p.priceType === 'retail').length;

      // If priceType is not explicitly set, try to determine from products
      const determinedPriceType =
        priceType !== 'wholesale' && priceType !== 'retail' ?
          (wholesaleCount >= retailCount ? 'wholesale' : 'retail') :
          priceType;

      return {
        id: sale.id,
        displaySlNumber: index + 1, // Sequential SL number for display
        originalSlNumber: originalSlNumber, // Original SL number from the seller
        serialNumber: sale.serialNumber, // Raw serialNumber from the invoice
        slNumber: sale.slNumber, // Raw slNumber from the sales service
        customerName: sale.customerName || "অজানা গ্রাহক",
        staffName: sale.staffName || "অজানা স্টাফ",
        staffEmail: sale.staffEmail,
        isAdmin: sale.staffEmail === userEmail && userRole === USER_ROLES.ADMIN,
        totalAmount: sale.totalAmount || 0,
        totalQuantity: sale.totalQuantity || 0,
        products: sale.products || [],
        returnProducts: sale.returnProducts || [],
        date: formattedDate,
        time: formattedTime,
        createdAt: createdAt,
        previousDue: sale.previousDue || 0,
        deposit: sale.deposit || 0,
        currentDue: sale.currentDue || 0,
        priceType: determinedPriceType, // Add price type
        wholesaleCount: wholesaleCount, // Add wholesale count
        retailCount: retailCount, // Add retail count
      };
    });

    // Sort by date (newest first)
    formattedSales.sort((a, b) => b.createdAt - a.createdAt);

    // Re-assign sequential numbers after sorting
    formattedSales.forEach((sale, index) => {
      sale.displaySlNumber = index + 1;
    });

    setSalesData(formattedSales);
    setTotalAmount(total);
  };

  // Render table header
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: "10%" }]}>ক্রমিক</Text>
      <Text style={[styles.headerCell, { width: "20%" }]}>গ্রাহক</Text>
      <Text style={[styles.headerCell, { width: "20%" }]}>বিক্রেতা</Text>
      <Text style={[styles.headerCell, { width: "15%" }]}>পরিমাণ</Text>
      <Text style={[styles.headerCell, { width: "15%" }]}>মূল্য</Text>
      <Text style={[styles.headerCell, { width: "20%" }]}>বর্তমান বাকি</Text>
    </View>
  );

  // Render a row in the table
  const renderRow = ({ item }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => {
        setSelectedSale(item);
        setModalVisible(true);
      }}
    >
      <Text style={[styles.cell, { width: "10%" }]}>
        {convertToBengaliNumber(item.displaySlNumber)}
      </Text>
      <Text style={[styles.cell, { width: "20%" }]}>{item.customerName}</Text>
      <Text
        style={[
          styles.cell,
          { width: "20%" },
          item.isAdmin ? styles.adminText : null
        ]}
      >
        {item.staffName}{item.isAdmin ? ' (A)' : ''}
      </Text>
      <Text style={[styles.cell, { width: "15%" }]}>
        {convertToBengaliNumber(item.totalQuantity)}
      </Text>
      <View style={[styles.cell, { width: "15%" }]}>
        <Text style={styles.amountText}>
          {convertToBengaliNumber(item.totalAmount)}
        </Text>
        <View style={styles.priceTypeContainer}>
          {item.wholesaleCount > 0 && (
            <Text style={[
              styles.priceTypeText,
              styles.wholesaleText,
              item.wholesaleCount === 0 ? styles.dimmedText : null
            ]}>
              পাইকারি: {convertToBengaliNumber(item.wholesaleCount)}
            </Text>
          )}
          {item.retailCount > 0 && (
            <Text style={[
              styles.priceTypeText,
              styles.retailText,
              item.retailCount === 0 ? styles.dimmedText : null
            ]}>
              খুচরা: {convertToBengaliNumber(item.retailCount)}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.cell, { width: "20%" }]}>
        {item.currentDue > 0 ? (
          <Text style={styles.currentDueText}>
            বর্তমান বাকি: {convertToBengaliNumber(item.currentDue)}
          </Text>
        ) : (
          <Text style={styles.noDueText}>কোন বাকি নেই</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render total row
  const renderTotalRow = () => {
    const totalDue = salesData.reduce((sum, item) => sum + (item.currentDue || 0), 0);

    return (
      <View style={styles.totalRow}>
        <Text style={[styles.totalCell, { width: "50%" }]}>মোট</Text>
        <Text style={[styles.totalCell, { width: "15%" }]}>
          {convertToBengaliNumber(
            salesData.reduce((sum, item) => sum + item.totalQuantity, 0)
          )}
        </Text>
        <Text style={[styles.totalCell, { width: "15%" }]}>
          {convertToBengaliNumber(totalAmount)}
        </Text>
        <Text style={[styles.totalCell, { width: "20%" }, totalDue > 0 ? styles.currentDueText : null]}>
          {totalDue > 0 ? convertToBengaliNumber(totalDue) : '-'}
        </Text>
      </View>
    );
  };

  // Function to download all sales as PDF
  const downloadAllSalesAsPDF = async () => {
    if (salesData.length === 0) {
      Alert.alert('কোন ডাটা নেই', 'ডাউনলোড করার জন্য কোন বিক্রয় তথ্য পাওয়া যায়নি।');
      return;
    }

    try {
      setLoading(true);

      // Generate PDF content with all sales
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
              .return-row { background-color: #ffebee; color: #c62828; }
              .return-header { background-color: #ffebee; color: #c62828; text-align: center; font-weight: bold; }
              .wholesale { color: #4CAF50; font-weight: bold; }
              .retail { color: #FF9800; font-weight: bold; }
              .current-due { color: #ff0000; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>বিক্রেতার বিক্রি</h1>
            <p style="text-align: center;">মোট বিক্রি: ${salesData.length}টি</p>
      `;

      // First add a summary table of all sales
      htmlContent += `
        <table class="summary-table">
          <tr class="summary-header">
            <th>ক্রমিক</th>
            <th>তারিখ</th>
            <th>গ্রাহকের নাম</th>
            <th>বিক্রেতা</th>
            <th>পণ্যের সংখ্যা</th>
            <th>মোট মূল্য</th>
            <th>বাকি</th>
          </tr>
      `;

      let totalAmount = 0;
      let totalDue = 0;

      // Add each sale to the summary table
      salesData.forEach((sale) => {
        const currentDue = sale.currentDue || 0;
        totalAmount += sale.totalAmount || 0;
        totalDue += currentDue;

        htmlContent += `
          <tr>
            <td>${sale.displaySlNumber}</td>
            <td>${sale.date} ${sale.time}</td>
            <td>${sale.customerName || "অজানা"}</td>
            <td>${sale.staffName}${sale.isAdmin ? ' (A)' : ''}</td>
            <td>${sale.totalQuantity}</td>
            <td>${sale.totalAmount} টাকা</td>
            <td style="${currentDue > 0 ? 'color: #ff0000; font-weight: bold;' : ''}">${currentDue > 0 ? currentDue + ' টাকা' : '-'}</td>
          </tr>
        `;
      });

      // Add summary totals
      htmlContent += `
          <tr style="font-weight: bold; background-color: #f5f5f5;">
            <td colspan="5" style="text-align: right;">সর্বমোট:</td>
            <td>${totalAmount} টাকা</td>
            <td style="color: #ff0000; font-weight: bold;">${totalDue} টাকা</td>
          </tr>
        </table>
        <hr style="margin: 40px 0;">
      `;

      // Add each sale in detail
      salesData.forEach((sale, index) => {
        htmlContent += `
          <div class="invoice-container">
            <h2>বিক্রি #${sale.displaySlNumber}</h2>
            <div class="header">
              <p>গ্রাহক: ${sale.customerName || "অজানা গ্রাহক"}</p>
              <p>বিক্রেতা: ${sale.staffName}${sale.isAdmin ? ' (A)' : ''}</p>
              <p>তারিখ: ${sale.date} ${sale.time}</p>
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

        // Add product rows for this sale
        sale.products.forEach((product, itemIndex) => {
          const priceType = product.priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা';
          const priceTypeColor = product.priceType === 'wholesale' ? '#4CAF50' : '#FF9800';

          htmlContent += `
            <tr>
              <td>${itemIndex + 1}</td>
              <td>${product.productName}</td>
              <td>${product.quantity}</td>
              <td>${product.price} টাকা</td>
              <td>${product.total} টাকা</td>
              <td style="color: ${priceTypeColor}; font-weight: bold;">${priceType}</td>
            </tr>
          `;
        });

        // Add return products if any
        if (sale.returnProducts && sale.returnProducts.length > 0) {
          htmlContent += `
            <tr>
              <td colspan="5" class="return-header">
                ফেরত পণ্য
              </td>
            </tr>
          `;

          sale.returnProducts.forEach((product, returnIndex) => {
            const priceType = product.priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা';
            const priceTypeColor = product.priceType === 'wholesale' ? '#4CAF50' : '#FF9800';

            htmlContent += `
              <tr class="return-row">
                <td>${sale.products.length + returnIndex + 1}</td>
                <td>${product.productName}</td>
                <td>${product.quantity}</td>
                <td>${Math.abs(product.price)} টাকা</td>
                <td>-${Math.abs(product.total)} টাকা</td>
                <td style="color: ${priceTypeColor}; font-weight: bold;">${priceType}</td>
              </tr>
            `;
          });
        }

        // Add total row and footer for this sale
        htmlContent += `
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold;">সর্বমোট:</td>
                <td style="font-weight: bold;">${sale.totalAmount} টাকা</td>
              </tr>
            </table>

            <div class="footer">
              ${sale.previousDue > 0 ? `<p>পূর্বের বাকি: ${sale.previousDue} টাকা</p>` : ''}
              ${sale.deposit > 0 ? `<p>জমা: ${sale.deposit} টাকা</p>` : ''}
              ${sale.currentDue > 0 ? `<p><strong style="color: #ff0000;">বর্তমান বাকি:</strong> <span style="color: #ff0000; font-weight: bold;">${sale.currentDue} টাকা</span></p>` : ''}
            </div>
          </div>
        `;

        // Don't add page break after the last sale
        if (index < salesData.length - 1) {
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
            const pdfName = `Salers_Sales_${formattedDate}.pdf`;
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
            Alert.alert('সফল', 'সকল বিক্রির পিডিএফ ডাউনলোড হয়েছে!');
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
    } finally {
      setLoading(false);
    }
  };

  // Render sale detail modal
  const renderSaleDetailModal = () => {
    if (!selectedSale) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>বিক্রয় বিবরণ</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.saleInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ক্রমিক:</Text>
                <Text style={styles.infoValue}>
                  {convertToBengaliNumber(selectedSale.serialNumber || selectedSale.originalSlNumber)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>তারিখ:</Text>
                <Text style={styles.infoValue}>
                  {selectedSale.date} {selectedSale.time}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>গ্রাহক:</Text>
                <Text style={styles.infoValue}>{selectedSale.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>বিক্রেতা:</Text>
                <Text style={[
                  styles.infoValue,
                  selectedSale.isAdmin ? styles.adminText : null
                ]}>
                  {selectedSale.staffName}{selectedSale.isAdmin ? ' (A)' : ''}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>মোট পরিমাণ:</Text>
                <Text style={styles.infoValue}>
                  {convertToBengaliNumber(selectedSale.totalQuantity)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>মোট মূল্য:</Text>
                <Text style={styles.infoValue}>
                  {convertToBengaliNumber(selectedSale.totalAmount)} টাকা
                </Text>
              </View>
              {selectedSale.previousDue > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>পূর্বের বাকি:</Text>
                  <Text style={styles.infoValue}>
                    {convertToBengaliNumber(selectedSale.previousDue)} টাকা
                  </Text>
                </View>
              )}
              {selectedSale.deposit > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>জমা:</Text>
                  <Text style={styles.infoValue}>
                    {convertToBengaliNumber(selectedSale.deposit)} টাকা
                  </Text>
                </View>
              )}
              {selectedSale.currentDue > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>বর্তমান বাকি:</Text>
                  <Text style={[styles.infoValue, styles.currentDueText]}>
                    {convertToBengaliNumber(selectedSale.currentDue)} টাকা
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.productsTitle}>পণ্য সমূহ</Text>
            <View style={styles.productsTable}>
              <View style={styles.productHeader}>
                <Text style={[styles.productHeaderCell, { width: "30%" }]}>
                  পণ্যের নাম
                </Text>
                <Text style={[styles.productHeaderCell, { width: "15%" }]}>
                  পরিমাণ
                </Text>
                <Text style={[styles.productHeaderCell, { width: "15%" }]}>
                  মূল্য
                </Text>
                <Text style={[styles.productHeaderCell, { width: "15%" }]}>
                  মোট
                </Text>
                <Text style={[styles.productHeaderCell, { width: "25%" }]}>
                  ধরন
                </Text>
              </View>

              {selectedSale.products.map((product, index) => (
                <View key={index} style={styles.productRow}>
                  <Text style={[styles.productCell, { width: "30%" }]}>
                    {product.productName}
                  </Text>
                  <Text style={[styles.productCell, { width: "15%" }]}>
                    {convertToBengaliNumber(product.quantity)}
                  </Text>
                  <Text style={[styles.productCell, { width: "15%" }]}>
                    {convertToBengaliNumber(product.price)}
                  </Text>
                  <Text style={[styles.productCell, { width: "15%" }]}>
                    {convertToBengaliNumber(product.total)}
                  </Text>
                  <Text style={[
                    styles.productCell,
                    { width: "25%" },
                    product.priceType === 'wholesale' ? styles.wholesaleText : styles.retailText
                  ]}>
                    {product.priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা'}
                  </Text>
                </View>
              ))}
            </View>

            {selectedSale.returnProducts && selectedSale.returnProducts.length > 0 && (
              <>
                <Text style={styles.productsTitle}>ফেরত পণ্য সমূহ</Text>
                <View style={styles.productsTable}>
                  <View style={styles.productHeader}>
                    <Text style={[styles.productHeaderCell, { width: "30%" }]}>
                      পণ্যের নাম
                    </Text>
                    <Text style={[styles.productHeaderCell, { width: "15%" }]}>
                      পরিমাণ
                    </Text>
                    <Text style={[styles.productHeaderCell, { width: "15%" }]}>
                      মূল্য
                    </Text>
                    <Text style={[styles.productHeaderCell, { width: "15%" }]}>
                      মোট
                    </Text>
                    <Text style={[styles.productHeaderCell, { width: "25%" }]}>
                      ধরন
                    </Text>
                  </View>

                  {selectedSale.returnProducts.map((product, index) => (
                    <View key={index} style={styles.productRow}>
                      <Text style={[styles.productCell, { width: "30%" }]}>
                        {product.productName}
                      </Text>
                      <Text style={[styles.productCell, { width: "15%" }]}>
                        {convertToBengaliNumber(product.quantity)}
                      </Text>
                      <Text style={[styles.productCell, { width: "15%" }]}>
                        {convertToBengaliNumber(Math.abs(product.price))}
                      </Text>
                      <Text style={[styles.productCell, { width: "15%" }, styles.returnText]}>
                        -{convertToBengaliNumber(Math.abs(product.total))}
                      </Text>
                      <Text style={[
                        styles.productCell,
                        { width: "25%" },
                        product.priceType === 'wholesale' ? styles.wholesaleText : styles.retailText,
                        styles.returnText
                      ]}>
                        {product.priceType === 'wholesale' ? 'পাইকারি' : 'খুচরা'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <LogoTitle title="বিক্রেতার বিক্রি" />
        </View>

        {salesData.length > 0 && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={downloadAllSalesAsPDF}
            disabled={loading}
          >
            <Feather name="download" size={20} color="white" />
            <Text style={styles.downloadButtonText}>ডাউনলোড</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      ) : salesData.length > 0 ? (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={salesData}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
          />
          {renderTotalRow()}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={50} color="#ccc" />
          <Text style={styles.emptyText}>আজ কোন বিক্রি হয়নি</Text>
        </View>
      )}

      {renderSaleDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: mS(16),
    marginTop: mS(40),
  },
  headerTitleContainer: {
    flex: 1,
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: mS(8),
    paddingHorizontal: mS(12),
    borderRadius: mS(5),
  },
  downloadButtonText: {
    color: 'white',
    fontSize: mS(14),
    fontWeight: 'bold',
    marginLeft: mS(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: mS(10),
    fontSize: mS(16),
    color: "#4CAF50",
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: mS(10),
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: mS(12),
    paddingHorizontal: mS(5),
    borderRadius: mS(5),
  },
  headerCell: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: mS(14),
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: mS(12),
    paddingHorizontal: mS(5),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    fontSize: mS(14),
    textAlign: "center",
  },
  adminText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  wholesaleText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  retailText: {
    color: "#FF9800",
    fontWeight: "bold",
  },
  dimmedText: {
    opacity: 0.5,
  },
  priceTypeContainer: {
    flexDirection: 'column',
    marginTop: mS(2),
  },
  priceTypeText: {
    fontSize: mS(11),
    marginTop: mS(2),
  },
  amountText: {
    fontSize: mS(14),
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: mS(12),
    paddingHorizontal: mS(5),
    backgroundColor: "#E8F5E9",
    borderTopWidth: 1,
    borderTopColor: "#4CAF50",
  },
  totalCell: {
    fontSize: mS(14),
    fontWeight: "bold",
    textAlign: "center",
    color: "#2E7D32",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: mS(20),
  },
  emptyText: {
    marginTop: mS(10),
    fontSize: mS(16),
    color: "#666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: mS(10),
    padding: mS(20),
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: mS(15),
  },
  modalTitle: {
    fontSize: mS(18),
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: mS(5),
  },
  saleInfo: {
    marginBottom: mS(20),
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: mS(5),
  },
  infoLabel: {
    width: "40%",
    fontSize: mS(14),
    fontWeight: "bold",
    color: "#555",
  },
  infoValue: {
    width: "60%",
    fontSize: mS(14),
    color: "#333",
  },
  productsTitle: {
    fontSize: mS(16),
    fontWeight: "bold",
    marginBottom: mS(10),
    color: "#333",
  },
  productsTable: {
    marginBottom: mS(20),
  },
  productHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: mS(8),
    paddingHorizontal: mS(5),
    borderRadius: mS(5),
  },
  productHeaderCell: {
    fontSize: mS(13),
    fontWeight: "bold",
    color: "#555",
    textAlign: "center",
  },
  productRow: {
    flexDirection: "row",
    paddingVertical: mS(8),
    paddingHorizontal: mS(5),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productCell: {
    fontSize: mS(13),
    color: "#333",
    textAlign: "center",
  },
  returnText: {
    color: "#c62828",
    fontWeight: "bold",
  },
  currentDueText: {
    color: "#ff0000",
    fontWeight: "bold",
    fontSize: mS(15),
  },
  noDueText: {
    color: "#4CAF50",
    fontSize: mS(13),
    fontStyle: "italic",
  },
});

export default AdminTodaySalesScreen;
