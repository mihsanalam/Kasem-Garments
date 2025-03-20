import React, { useState } from "react";
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
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

const ReturnStockTable = () => {
  const [filterVisible, setFilterVisible] = useState(false);
  const [tableData, setTableData] = useState([]);
  const PRODUCTS_STORAGE_KEY = "sub_product_data";

  // Sample data based on the image
  // const tableData = [
  //   {
  //     date: "০৪/০১/২০২৫",
  //     name: "পুরুষদের জন্য ক্যাশুয়েল টি-শার্ট",
  //     quantity: "১০০",
  //     price: "৮৮০০",
  //   },
  //   {
  //     date: "০৪/০১/২০২৫",
  //     name: "পুরুষদের জন্য ক্যাশুয়েল টি-শার্ট",
  //     quantity: "১০০",
  //     price: "৮৮০০",
  //   },
  //   {
  //     date: "০৪/০১/২০২৫",
  //     name: "পুরুষদের জন্য ক্যাশুয়েল টি-শার্ট",
  //     quantity: "১০০",
  //     price: "৮৮০০",
  //   },
  //   {
  //     date: "০৪/০১/২০২৫",
  //     name: "পুরুষদের জন্য ক্যাশুয়েল টি-শার্ট",
  //     quantity: "১০০",
  //     price: "৮৮০০",
  //   },
  //   {
  //     date: "০৪/০১/২০২৫",
  //     name: "পুরুষদের জন্য ক্যাশুয়েল টি-শার্ট",
  //     quantity: "১০০",
  //     price: "৮৮০০",
  //   },
  // ];

  // Column definitions
  const columns = [
    { key: "date", title: "তারিখ", width: "20%" },
    { key: "name", title: "ক্রেতা/পণ্যের নাম", width: "40%" },
    { key: "quantity", title: "পরিমাণ", width: "20%" },
    { key: "price", title: "মূল্য", width: "20%" },
  ];


    useFocusEffect(
      React.useCallback(() => {
        const fetchProducts = async () => {
          try {
            // setLoading(true);
            const storedProductsJson = await SecureStore.getItemAsync(
              PRODUCTS_STORAGE_KEY
            );
  
            if (storedProductsJson) {
              const storedProducts = JSON.parse(storedProductsJson);
              setTableData(storedProducts);
              console.log("Products fetched from SecureStore:", storedProducts);
            } else {
              console.log("No products found in SecureStore");
              setTableData([]);
            }
          } catch (error) {
            console.error("Error fetching products from SecureStore:", error);
          } finally {
            // setLoading(false);
          }
        };
        fetchProducts();
      }, [])
    );

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
    <View style={styles.row}>
      <View style={[styles.cell, { width: columns[0].width }]}>
        <Text style={styles.cellText}>{item.date}</Text>
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
            {/* Date filter options would go here */}
          </View>

          <View style={styles.filterOption}>
            <Text style={styles.filterLabel}>পণ্য অনুযায়ী</Text>
            {/* Product filter options would go here */}
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
              onPress={() => setFilterVisible(false)}
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
      <View
        style={{
          marginBottom: 10,
          marginTop: 20,
          marginLeft: 10,
          marginRight: 10,
        }}
      >
        <LogoTitle title="ফেরত মালের স্টক" />
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

      {/* Table */}
      <FlatList
        data={tableData}
        ListHeaderComponent={renderHeader}
        renderItem={renderRow}
        keyExtractor={(item, index) => index.toString()}
        stickyHeaderIndices={[0]}
      />

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
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
  filterOption: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
