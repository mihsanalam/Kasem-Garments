import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import LogoTitle from "@/components/inventory/LogoTitle";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";

// Define storage key
const INVOICES_STORAGE_KEY = "invoices_data";

const TotalSales = () => {
  const [invoices, setInvoices] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState("০");
  const [filterVisible, setFilterVisible] = useState(false);

  // Fetch data from SecureStore
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Fetch invoices
          const storedInvoicesJson = await SecureStore.getItemAsync(
            INVOICES_STORAGE_KEY
          );
          
          if (storedInvoicesJson) {
            const invoicesData = JSON.parse(storedInvoicesJson);
            setInvoices(invoicesData);
            console.log("Invoices fetched from SecureStore:", invoicesData.length);
            
            // Process invoice data for the table
            processSalesData(invoicesData);
          } else {
            console.log("No invoices found in SecureStore");
            setInvoices([]);
            setSalesData([]);
            setTotalAmount("০");
          }
          
        } catch (error) {
          console.error("Error fetching data from SecureStore:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [])
  );
  
  // Process and transform invoice data for the sales table
  const processSalesData = (invoicesData) => {
    // Create a map to aggregate sales by product
    const salesByProduct = {};
    let total = 0;
    
    // Process each invoice
    invoicesData.forEach((invoice, index) => {
      // Check if invoice has items
      if (invoice.items && Array.isArray(invoice.items)) {
        // Process each item in the invoice
        invoice.items.forEach(item => {
          const productId = item.productId;
          const productName = item.productName;
          const quantity = parseInt(item.quantity) || 0;
          const price = parseInt(item.price) || 0;
          const itemTotal = quantity * price;
          
          // Add to total
          total += itemTotal;
          
          // Add to or update the sales aggregate
          if (salesByProduct[productId]) {
            salesByProduct[productId].quantity += quantity;
            salesByProduct[productId].price += itemTotal;
          } else {
            salesByProduct[productId] = {
              id: productId,
              serial: (index + 1).toString(),
              name: productName,
              quantity: quantity,
              price: itemTotal
            };
          }
        });
      }
    });
    
    // Convert the sales map to an array
    const salesArray = Object.values(salesByProduct).map((item, index) => ({
      ...item,
      serial: (index + 1).toString(), // Re-number serials
      quantity: item.quantity.toString(),
      price: item.price.toString()
    }));
    
    // Convert numbers to Bengali
    const salesArrayBengali = salesArray.map(item => ({
      ...item,
      serial: convertToBengaliNumber(item.serial),
      quantity: convertToBengaliNumber(item.quantity),
      price: convertToBengaliNumber(item.price)
    }));
    
    // Update state
    setSalesData(salesArrayBengali);
    setTotalAmount(convertToBengaliNumber(total.toString()));
  };
  
  // Helper function to convert numbers to Bengali
  const convertToBengaliNumber = (number) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return number.toString().replace(/\d/g, match => bengaliDigits[parseInt(match)]);
  };

  // Column definitions
  const columns = [
    { key: "serial", title: "সিরিয়াল", width: "15%" },
    { key: "name", title: "পণ্যের নাম", width: "45%" },
    { key: "quantity", title: "পরিমাণ", width: "20%" },
    { key: "price", title: "মূল্য", width: "20%" },
  ];

  // Render table header
  const renderTableHeader = () => (
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
    <View style={styles.row}>
      <View style={[styles.cell, { width: columns[0].width }]}>
        <Text style={styles.cellText}>{item.serial}</Text>
      </View>
      <View style={[styles.cell, { width: columns[1].width }]}>
        <Text style={styles.cellText}>{item.name}</Text>
      </View>
      <View style={[styles.cell, { width: columns[2].width }]}>
        <Text style={styles.cellText}>{item.quantity}</Text>
      </View>
      <View style={[styles.cell, { width: columns[3].width }]}>
        <Text style={styles.cellText}>{item.price}</Text>
      </View>
    </View>
  );

  // Render total row
  const renderTotal = () => (
    <View style={styles.totalRow}>
      <View style={[styles.totalLabelCell, { width: "80%" }]}>
        <Text style={styles.totalLabel}>মোট বিক্রি</Text>
      </View>
      <View style={[styles.totalValueCell, { width: "20%" }]}>
        <Text style={styles.totalValue}>{totalAmount}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          marginBottom: 10,
          marginTop: 20,
          marginLeft: 10,
          marginRight: 10,
        }}
      >
        <LogoTitle title="মোট বিক্রি" />
      </View>
      
      {/* Filter Button */}
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Feather name="filter" size={16} color="#000" />
          <Text style={styles.filterButtonText}>ফিল্টার</Text>
        </TouchableOpacity>
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

          {renderTotal()}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>কোন বিক্রয় তথ্য পাওয়া যায়নি</Text>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterVisible}
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ফিল্টার অপশন</Text>

            <View style={styles.filterOptions}>
              <Text style={styles.filterOptionLabel}>তারিখ অনুযায়ী</Text>
              {/* Date filter options would go here */}
            </View>

            <View style={styles.filterOptions}>
              <Text style={styles.filterOptionLabel}>পণ্য অনুযায়ী</Text>
              {/* Product filter options would go here */}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.buttonText}>বাতিল</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={[styles.buttonText, styles.applyButtonText]}>
                  প্রয়োগ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#555",
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filterButtonContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  filterButtonText: {
    marginLeft: 8,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
  },
  headerCell: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    padding: 12,
    justifyContent: "center",
  },
  cellText: {
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  totalLabelCell: {
    padding: 12,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  totalValueCell: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: 16,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 16,
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
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  filterOptions: {
    marginBottom: 16,
  },
  filterOptionLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
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
  },
});

export default TotalSales;