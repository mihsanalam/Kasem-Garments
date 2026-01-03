import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import ArrowTitle from "../components/common/ArrowTitle";
import { mS } from "@/style/responsive";
import { productService } from "../service/api/product";

// Helper function to convert numbers to Bengali
const formatNumber = (number) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return number.toString().split('').map(digit => banglaDigits[parseInt(digit)] || digit).join('');
};

// Helper function to format Firestore timestamp to Bengali date
const formatFirestoreDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${formatNumber(day)}-${formatNumber(month)}-${formatNumber(year)}`;
  } catch (error) {
    return 'N/A';
  }
};

// Table Header Component
const TableHeader = () => {
  return (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { flex: 1.5 }]}>তারিখ</Text>
      <Text style={[styles.headerCell, { flex: 2 }]}>পণ্যের নাম</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>স্টক ইন</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>স্টক আউট</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>স্টক আছে</Text>
    </View>
  );
};

// Table Row Component
const TableRow = ({ item }) => {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatFirestoreDate(item.dateAdded)}</Text>
      <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>{formatNumber(item.stockIn)}</Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>{formatNumber(item.stockOut)}</Text>
      <Text style={[
        styles.tableCell,
        {
          flex: 1,
          color: item.currentStock > 0 ? '#2E7D32' : '#D32F2F'
        }
      ]}>{formatNumber(item.currentStock)}</Text>
    </View>
  );
};

// Product Stock Table Screen
const ProductStockTable = () => {
  const params = useLocalSearchParams();
  const productName = params.productName;

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [totals, setTotals] = useState({
    totalStockIn: 0,
    totalStockOut: 0,
    totalCurrentStock: 0
  });

  // Process data and create table entries
  const processProductData = (products) => {
    const tableRows = products.map(product => {
      // Skip products that don't match the filter or have no name
      if (!product || !product.name || product.name.trim() !== productName) return null;

      // Calculate stock values
      const stockIn = parseInt(product.originalQuantity) || 0;
      const stockOut = stockIn - (parseInt(product.currentStock) || 0);
      const currentStock = parseInt(product.currentStock) || 0;

      return {
        id: product.id,
        dateAdded: product.dateAdded,
        name: product.name.trim(), // Ensure name is trimmed
        stockIn,
        stockOut,
        currentStock
      };
    }).filter(row => row !== null);

    // Calculate totals
    const totalStockIn = tableRows.reduce((sum, row) => sum + row.stockIn, 0);
    const totalStockOut = tableRows.reduce((sum, row) => sum + row.stockOut, 0);
    const totalCurrentStock = totalStockIn - totalStockOut;

    setTotals({
      totalStockIn,
      totalStockOut,
      totalCurrentStock
    });

    return tableRows;
  };

  // Fetch products when component mounts
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const products = await productService.getAllProducts();
          const tableRows = processProductData(products);
          setTableData(tableRows);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [productName])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowTitle />
        </TouchableOpacity>
        <Text style={styles.headerText}> পণ্যের স্টক </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>স্টক ইন</Text>
          <Text style={styles.statValue}>{formatNumber(totals.totalStockIn)}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>স্টক আউট</Text>
          <Text style={styles.statValue}>{formatNumber(totals.totalStockOut)}</Text>
        </View>

        <View style={[styles.statCard, {
          borderLeftColor: totals.totalCurrentStock > 0 ? '#4CAF50' : '#F44336'
        }]}>
          <Text style={styles.statTitle}>স্টক আছে</Text>
          <Text style={[styles.statValue, {
            color: totals.totalCurrentStock > 0 ? '#1B5E20' : '#B71C1C'
          }]}>{formatNumber(totals.totalCurrentStock)}</Text>
        </View>
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>ডাটা লোড হচ্ছে...</Text>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          <TableHeader />

          <FlatList
            data={tableData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TableRow item={item} />}
            contentContainerStyle={styles.tableListContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>কোন পণ্য পাওয়া যায়নি</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: mS(25),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "center",
    marginBottom: mS(20),
    paddingHorizontal: mS(16),
    marginTop: mS(10),
  },
  headerText: {
    fontSize: mS(22),
    fontWeight: "bold",
    color: "#333",
    marginRight: mS(8),
    marginLeft: mS(10),
  },
  backButton: {
    // padding: mS(10),
    marginTop: mS(20),
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: mS(12),
    marginBottom: mS(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    padding: mS(10),
    borderRadius: 8,
    marginHorizontal: mS(3),
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    alignItems: "center",
  },
  statTitle: {
    fontSize: mS(14),
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: mS(5),
  },
  statValue: {
    fontSize: mS(16),
    fontWeight: "bold",
    color: "#1B5E20",
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: mS(10),
    marginBottom: mS(10),
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingHorizontal: mS(10),
    paddingVertical: mS(8),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  headerCell: {
    color: "#fff",
    fontWeight: "600",
    fontSize: mS(14),
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    padding: mS(10),
  },
  tableCell: {
    fontSize: mS(14),
    textAlign: "center",
  },
  tableListContainer: {
    flexGrow: 1,
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
  emptyContainer: {
    padding: mS(20),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: mS(16),
    color: "#666",
  },
});

export default ProductStockTable;