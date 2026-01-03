import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import LogoTitle from "@/components/inventory/LogoTitle";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { mS } from "../style/responsive";
import { returnProductService } from "../service/api/returnProduct";

const ReturnStockTable = () => {
  const parem = useLocalSearchParams();
  const productName = parem.productName;

  const [filterVisible, setFilterVisible] = useState(false);
  const [tableData, setTableData] = useState([]);
  const RETURNED_PRODUCTS_KEY = "returned_products_data";

  // Add this helper function at the top of the component
  const formatDate = (dateString) => {
    if (!dateString) return null;

    // Check if the date is already in DD-MM-YYYY format (possibly Bangla)
    if (typeof dateString === 'string' && dateString.includes('-') && dateString.length <= 10) {
      return dateString; // Return as is if it's already formatted
    }

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if it can't be parsed
      }

      // Add timezone offset to get correct local date
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      const day = String(localDate.getDate()).padStart(2, '0');
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const year = localDate.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string on error
    }
  };

  // Column definitions
  const columns = [
    { key: "date", title: "তারিখ", width: "25%" },
    { key: "name", title: "পণ্যের নাম", width: "35%" },
    { key: "items", title: "পরিমাণ", width: "15%" },
    { key: "price", title: "মূল্য", width: "25%" },
  ];

  useFocusEffect(
    React.useCallback(() => {
      const fetchReturnedProducts = async () => {
        try {
          // Fetch data from Firebase
          let firebaseData = [];

          if (productName) {
            // If a specific product name is provided, get only that product's returns
            const productReturns = await returnProductService.getReturnedProductsByName(productName);
            firebaseData = productReturns;
          } else {
            // Otherwise get all returned products
            firebaseData = await returnProductService.getAllReturnedProducts();
          }

          // Also fetch from local storage for backward compatibility
          const storedProductsJson = await SecureStore.getItemAsync(RETURNED_PRODUCTS_KEY);
          const storedProducts = storedProductsJson ? JSON.parse(storedProductsJson) : [];

          // Transform the data to match the table structure
          let transformedData = [];

          // Track unique product entries by a composite key to avoid duplicates
          const processedEntries = new Set();

          // Process Firebase data
          if (firebaseData && firebaseData.length > 0) {
            firebaseData.forEach((product) => {
              const { date, items, id } = product;

              // Process each item in the return record
              if (items && items.length > 0) {
                items.forEach((item, index) => {
                  // Check if price is negative (indicating a return)
                  const price = parseFloat(item.price) || 0;
                  const isReturn = price < 0;
                  // Always show positive price for returns
                  const displayPrice = `${Math.abs(price)} ৳`;

                  // Create a unique key for this entry based on product ID, name, date and quantity
                  const uniqueKey = `${id}-${item.productName}-${product.date}-${item.quantity}`;

                  // Only add if we haven't processed this exact entry before
                  if (!processedEntries.has(uniqueKey)) {
                    processedEntries.add(uniqueKey);

                    transformedData.push({
                      id: `firebase-${id}-${index}`,
                      date: formatDate(product.date), // Format the date here
                      name: item.productName || "Unknown Product",
                      items: (item.quantity || "0").toString(),
                      price: displayPrice,
                      isReturn: isReturn,
                      isFirstItem: index === 0,
                      rawData: { ...product, itemDetails: item },
                    });
                  }
                });
              }
            });
          }

          // Process local storage data for backward compatibility
          // Only add local storage items if they don't exist in Firebase data
          if (storedProducts && storedProducts.length > 0) {
            storedProducts.forEach((product) => {
              const { date, displayDate, items, id } = product;

              // Process each item in the return record
              if (items && items.length > 0) {
                items.forEach((item, index) => {
                  // Create a unique key for local storage items
                  const uniqueKey = `local-${id}-${item.productName}-${product.date}-${item.quantity || item.amount}`;

                  // Only add if we haven't processed this exact entry before
                  if (!processedEntries.has(uniqueKey)) {
                    processedEntries.add(uniqueKey);

                    transformedData.push({
                      id: `local-${id}-${index}`,
                      date: displayDate || formatDate(date), // Use displayDate if available, otherwise format date
                      name: item.productName || "Unknown Product",
                      items: (item.quantity || item.amount || "0").toString(),
                      price: `${Math.abs(item.price || 0)} ৳`,
                      isReturn: true, // Local storage items are always returns
                      isFirstItem: index === 0,
                      rawData: { ...product, itemDetails: item },
                    });
                  }
                });
              }
            });
          }

          // Filter data by productName if provided
          if (productName) {
            transformedData = transformedData.filter(
              (item) => item.name === productName
            );
          }

          setTableData(transformedData);
        } catch (error) {
          console.error("Error fetching returned products:", error);
          setTableData([]);
        }
      };

      fetchReturnedProducts();
    }, [productName])
  );

  // Calculate totals
  const calculateTotals = () => {
    const totalStockIn = tableData.reduce((sum, row) => sum + row.stockIn, 0);
    const totalStockOut = tableData.reduce((sum, row) => sum + row.stockOut, 0);
    const totalCurrentStock = tableData.reduce(
      (sum, row) => sum + row.currentStock,
      0
    );

    return {
      totalStockIn,
      totalStockOut,
      totalCurrentStock,
    };
  };

  // Render table header
  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((column) => (
        <View
          key={column.key}
          style={[styles.headerCell, { width: column.width }]}
        >
          <Text style={styles.headerText}>{column.title}</Text>
        </View>
      ))}
    </View>
  );

  // Render a row
  const renderRow = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        // You can add a detailed view or action here
        console.log("Pressed item details:", item.rawData);
      }}
    >
      <View style={[styles.cell, { width: columns[0].width }]}>
        <Text style={styles.cellText}>{item.date}</Text>
      </View>
      <View style={[styles.cell, { width: columns[1].width }]}>
        <Text style={styles.cellText}>{item.name}</Text>
      </View>
      <View style={[styles.cell, { width: columns[2].width }]}>
        <Text style={styles.cellText}>{item.items}</Text>
      </View>
      <View style={[styles.cell, { width: columns[3].width }]}>
        <Text
          style={[
            styles.cellText,
            // Apply red color for negative values (returns)
            item.isReturn || item.price.startsWith('-') ? styles.returnPrice : null
          ]}
        >
          {item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="package" size={50} color="#ccc" />
      <Text style={styles.emptyText}>কোন ফেরত মাল নেই</Text>
    </View>
  );

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterVisible}
      onRequestClose={() => setFilterVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>ফিল্টার অপশন</Text>

          <View style={styles.filterOption}>
            <Text style={styles.filterLabel}>তারিখ অনুযায়ী</Text>
            {/* Date picker would go here */}
            <View style={styles.datePickerPlaceholder}>
              <Text style={styles.placeholderText}>শুরু:</Text>
              <Text style={styles.placeholderText}>শেষ:</Text>
            </View>
          </View>

          <View style={styles.filterOption}>
            <Text style={styles.filterLabel}>পণ্য অনুযায়ী</Text>
            {/* Product selector would go here */}
            <View style={styles.pickerPlaceholder}>
              <Text style={styles.placeholderText}>পণ্য নির্বাচন করুন</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.buttonText}>বাতিল</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={() => {
                // Apply filter logic would go here
                setFilterVisible(false);
              }}
            >
              <Text style={styles.applyButtonText}>প্রয়োগ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <LogoTitle title="ফেরত মালের স্টক" />
      </View>

      {/* Filter Button */}
      {/* <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Feather name="filter" size={16} color="#000" />
          <Text style={styles.filterButtonText}>ফিল্টার</Text>
        </TouchableOpacity>
      </View> */}

      {/* Table */}
      {tableData.length > 0 ? (
        <FlatList
          data={tableData}
          ListHeaderComponent={renderHeader}
          renderItem={renderRow}
          keyExtractor={(item) => item.id.toString()}
          stickyHeaderIndices={[0]}
          contentContainerStyle={styles.tableContainer}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: mS(10),
  },
  header: {
    marginTop: mS(50),
    marginVertical: mS(15),
    marginHorizontal: mS(10),
  },
  tableContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: mS(20),
  },
  emptyText: {
    fontSize: mS(16),
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  filterButtonContainer: {
    padding: mS(10),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: mS(12),
    paddingVertical: mS(8),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  filterButtonText: {
    marginLeft: mS(8),
    fontWeight: "500",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
  },
  headerCell: {
    padding: mS(12),
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.3)",
  },
  headerText: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    fontSize: mS(14),
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  cell: {
    padding: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  cellText: {
    textAlign: "center",
    fontSize: mS(14),
  },
  returnPrice: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: mS(20),
    elevation: 5,
  },
  modalTitle: {
    fontSize: mS(18),
    fontWeight: "bold",
    marginBottom: mS(16),
    textAlign: "center",
  },
  filterOption: {
    marginBottom: mS(16),
  },
  filterLabel: {
    fontSize: mS(16),
    marginBottom: mS(8),
  },
  datePickerPlaceholder: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: mS(10),
  },
  pickerPlaceholder: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: mS(10),
  },
  placeholderText: {
    color: "#666",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: mS(16),
  },
  button: {
    paddingVertical: mS(10),
    paddingHorizontal: mS(16),
    borderRadius: 4,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  applyButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    fontWeight: "500",
  },
  applyButtonText: {
    color: "white",
    fontWeight: "500",
  },
});

export default ReturnStockTable;