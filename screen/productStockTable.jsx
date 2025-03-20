import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LogoTitle from "@/components/inventory/LogoTitle";
import { AntDesign } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";

// Define storage keys
const PRODUCTS_STORAGE_KEY = "product_data";
const INVOICES_STORAGE_KEY = "invoices_data";

const ProductStockTable = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from SecureStore
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Fetch products
          const storedProductsJson = await SecureStore.getItemAsync(
            PRODUCTS_STORAGE_KEY
          );
          
          let productsData = [];
          if (storedProductsJson) {
            productsData = JSON.parse(storedProductsJson);
            setProducts(productsData);
            console.log("Products fetched from SecureStore:", productsData.length);
          } else {
            console.log("No products found in SecureStore");
            setProducts([]);
          }
          
          // Fetch invoices
          const storedInvoicesJson = await SecureStore.getItemAsync(
            INVOICES_STORAGE_KEY
          );
          
          let invoicesData = [];
          if (storedInvoicesJson) {
            invoicesData = JSON.parse(storedInvoicesJson);
            setInvoices(invoicesData);
            console.log("Invoices fetched from SecureStore:", invoicesData.length);
          } else {
            console.log("No invoices found in SecureStore");
            setInvoices([]);
          }
          
          // Create table data
          processTableData(productsData, invoicesData);
          
        } catch (error) {
          console.error("Error fetching data from SecureStore:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [])
  );
  
  // Process and transform data for the table
  const processTableData = (productsData, invoicesData) => {
    // Calculate stock out quantities from invoices
    const stockOutMap = {};
    
    // Process each invoice
    invoicesData.forEach(invoice => {
      // Check if invoice has items
      if (invoice.items && Array.isArray(invoice.items)) {
        // Process each item in the invoice
        invoice.items.forEach(item => {
          const productId = item.productId;
          
          // Add to existing stock out count or initialize
          stockOutMap[productId] = (stockOutMap[productId] || 0) + item.quantity;
        });
      }
    });
    
    // Create table rows from products data
    const tableRows = productsData.map(product => {
      // Get stock out quantity for this product
      const stockOut = stockOutMap[product.id] || 0;
      
      // Calculate current stock
      const stockIn = parseInt(product.originalQuantity || product.quantity) || 0;
      const currentStock = stockIn - stockOut;
      
      return {
        id: product.id,
        date: product.date || "N/A",
        name: product.name,
        totalIn: stockIn.toString(),
        totalOut: stockOut.toString(),
        totalAdd: currentStock.toString()
      };
    });
    
    setTableData(tableRows);
  };

  // Column headers
  const headers = [
    { key: "date", label: "তারিখ" },
    { key: "name", label: "পণ্যের নাম" },
    { key: "totalIn", label: "ইন করন" },
    { key: "totalOut", label: "ইন আউট" },
    { key: "totalAdd", label: "স্টক আছে" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          marginBottom: 20,
          marginTop: 20,
          marginLeft: 10,
          marginRight: 10,
        }}
      >
        <LogoTitle title="পণ্যের স্টক" />
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <AntDesign name="filter" size={24} color="black" />
          <Text style={styles.filterText}>ফিল্টার</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      ) : tableData.length > 0 ? (
        <ScrollView horizontal>
          <View>
            {/* Table Header */}
            <View style={styles.headerRow}>
              {headers.map((header) => (
                <View
                  key={header.key}
                  style={[
                    styles.headerCell,
                    header.key === "name" ? styles.nameCell : null,
                  ]}
                >
                  <Text style={styles.headerText}>{header.label}</Text>
                </View>
              ))}
            </View>

            {/* Table Data */}
            <ScrollView>
              {tableData.map((row, index) => (
                <View key={row.id || index} style={styles.dataRow}>
                  <View style={styles.dataCell}>
                    <Text style={styles.dataText}>{row.date}</Text>
                  </View>
                  <View style={[styles.dataCell, styles.nameCell]}>
                    <Text style={styles.dataText}>{row.name}</Text>
                  </View>
                  <View style={styles.dataCell}>
                    <Text style={styles.dataText}>{row.totalIn}</Text>
                  </View>
                  <View style={styles.dataCell}>
                    <Text style={styles.dataText}>{row.totalOut}</Text>
                  </View>
                  <View style={[styles.dataCell, 
                    parseInt(row.totalAdd) <= 0 ? styles.negativeStock : null]}>
                    <Text style={[styles.dataText, 
                      parseInt(row.totalAdd) <= 0 ? styles.negativeStockText : null]}>
                      {row.totalAdd}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>কোন পণ্য পাওয়া যায়নি</Text>
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
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    padding: 8,
    alignSelf: "flex-start",
  },
  filterText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerCell: {
    padding: 12,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  nameCell: {
    width: 200,
  },
  headerText: {
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dataCell: {
    padding: 12,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  dataText: {
    textAlign: "center",
  },
  negativeStock: {
    backgroundColor: "#FFEBEE",
  },
  negativeStockText: {
    color: "#D32F2F",
    fontWeight: "bold",
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
});

export default ProductStockTable;