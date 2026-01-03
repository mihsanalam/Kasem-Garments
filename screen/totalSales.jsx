import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import LogoTitle from "@/components/inventory/LogoTitle";
import { useFocusEffect } from "expo-router";
import { mS } from "../style/responsive";
import { AntDesign } from "@expo/vector-icons";
import { salesService } from "../service/api/sales";

const TotalSales = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState("০");
  const [showFilter, setShowFilter] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sales data from Firebase
      const salesFromFirebase = await salesService.getAllSales();

      if (salesFromFirebase && salesFromFirebase.length > 0) {
        processSalesData(salesFromFirebase);
      } else {
        setSalesData([]);
        setFilteredSalesData([]);
        setTotalAmount("০");
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      Alert.alert("ত্রুটি", "বিক্রয় তথ্য লোড করতে সমস্যা হয়েছে");
      setSalesData([]);
      setFilteredSalesData([]);
      setTotalAmount("০");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData(); // Ensure data is fetched on component load
    }, [])
  );

  const processSalesData = (salesData) => {
    let total = 0;

    // Process each sale
    const formattedSales = salesData.map((sale, index) => {
      // Add to total amount
      total += sale.totalAmount || 0;

      // Check if the staff is an admin by looking at the email
      // Admin email is defined in config/auth.js as "zunaidarzu22@gmail.com"
      const isAdmin = sale.staffEmail === "zunaidarzu22@gmail.com";

      return {
        id: sale.id || `sale-${index}`,
        name: sale.customerName || "অজানা গ্রাহক",
        staffName: sale.staffName || "অজানা স্টাফ",
        isAdmin: isAdmin,
        amount: sale.totalAmount || 0,
        serial: convertToBengaliNumber(sale.slNumber || (index + 1)),
        quantity: convertToBengaliNumber(sale.totalQuantity || 0),
        price: convertToBengaliNumber(sale.totalAmount || 0),
        date: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '',
        products: sale.products || []
      };
    });

    // Sort by date (newest first)
    formattedSales.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    setSalesData(formattedSales);
    setFilteredSalesData(formattedSales);
    setTotalAmount(convertToBengaliNumber(total));
  };

  const convertToBengaliNumber = (number) => {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return number.toString().replace(/\d/g, (match) => bengaliDigits[parseInt(match)]);
  };

  const renderTableHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, { flex: 1 }]}>সিরিয়াল</Text>
      <Text style={[styles.headerCell, { flex: 2 }]}>বিক্রেতার নাম</Text>
      <Text style={[styles.headerCell, { flex: 2 }]}>ক্রেতার নাম</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>পণ্যের সংখ্যা</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>মোট টাকা</Text>
    </View>
  );

  const renderRow = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 1 }]}>{item.serial}</Text>
      <View style={[styles.staffNameContainer, { flex: 2 }]}>
        <Text style={styles.cell}>{item.staffName}</Text>
        {item.isAdmin && (
          <Text style={styles.adminIndicator}>(A)</Text>
        )}
      </View>
      <Text style={[styles.cell, { flex: 2 }]}>{item.name}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.quantity}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.price}</Text>
    </View>
  );

  const renderTotalRow = () => (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, { flex: 5 }]}>মোট বিক্রি</Text>
      <Text style={[styles.totalValue, { flex: 4 }]}>{totalAmount}</Text>
    </View>
  );

  // Filter Modal Component
  const FilterModal = ({ visible, onClose }) => {
    const [tempName, setTempName] = useState(filterName);
    const [tempPrice, setTempPrice] = useState(filterPrice);

    const convertBengaliToEnglish = (bengaliNumber) => {
      const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return bengaliNumber.toString().split('').map(char => {
        const index = bengaliNumerals.indexOf(char);
        return index !== -1 ? index : char;
      }).join('');
    };

    const handleApplyFilter = () => {
      setFilterName(tempName);
      setFilterPrice(tempPrice);

      let filtered = [...salesData];

      if (tempName) {
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(tempName.toLowerCase())
        );
      }

      if (tempPrice) {
        filtered = filtered.filter(item => {
          const itemPrice = parseInt(convertBengaliToEnglish(item.price));
          const filterPriceNum = parseInt(tempPrice);
          return !isNaN(itemPrice) && !isNaN(filterPriceNum) && itemPrice >= filterPriceNum;
        });
      }

      setFilteredSalesData(filtered);
      onClose();
    };

    const handleReset = () => {
      setTempName("");
      setTempPrice("");
      setFilterName("");
      setFilterPrice("");
      setFilteredSalesData(salesData);
      onClose();
    };

    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>ফিল্টার করুন</Text>

            <View style={styles.filterInputContainer}>
              <Text style={styles.filterLabel}>ক্রেতার নাম</Text>
              <View style={styles.inputWrapper}>
                <AntDesign name="user" style={styles.filterIcon} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="ক্রেতার নাম দিয়ে খুঁজুন"
                  value={tempName}
                  onChangeText={setTempName}
                />
              </View>
            </View>

            <View style={styles.filterInputContainer}>
              <Text style={styles.filterLabel}>সর্বনিম্ন মূল্য</Text>
              <View style={styles.inputWrapper}>
                <AntDesign name="creditcard" style={styles.filterIcon} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="সর্বনিম্ন মূল্য লিখুন"
                  value={tempPrice}
                  onChangeText={setTempPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterButtonsContainer}>
              <TouchableOpacity
                style={[styles.filterButton, styles.applyButton]}
                onPress={handleApplyFilter}
              >
                <Text style={styles.filterButtonText}>প্রয়োগ করুন</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={styles.filterButtonText}>রিসেট</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <AntDesign name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <ScrollView> */}
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          <LogoTitle title="মোট বিক্রি" />
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)}>
          <AntDesign name="filter" style={styles.filterIconHeader} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      ) : filteredSalesData.length > 0 ? (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={filteredSalesData}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
          />
          {renderTotalRow()}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>কোন বিক্রয় তথ্য পাওয়া যায়নি</Text>
        </View>
      )}

      <FilterModal visible={showFilter} onClose={() => setShowFilter(false)} />
      {/* </ScrollView> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: mS(50),
  },
  staffNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminIndicator: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: mS(4),
    fontSize: mS(14),
  },
  warningContainer: {
    backgroundColor: "#FFCC00",
    padding: mS(10),
    borderRadius: mS(5),
    marginBottom: mS(10),
  },
  warningText: {
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: mS(10),
    fontSize: mS(16),
    color: "#555",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: mS(16),
    color: "#555",
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: mS(10),
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    padding: mS(10),
  },
  headerCell: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: mS(10),
  },
  cell: {
    textAlign: "center",
    fontSize: mS(14),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    padding: mS(10),
  },
  totalLabel: {
    fontWeight: "bold",
    fontSize: mS(16),
    // textAlign: "right",
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: mS(16),
    // textAlign: "center",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: mS(10),
    marginTop: mS(20),
    marginLeft: mS(10),
    marginRight: mS(10),
  },
  filterIconHeader: {
    fontSize: mS(30),
    color: "#4CAF50",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: mS(10),
    padding: mS(20),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: mS(18),
    fontWeight: "bold",
    marginBottom: mS(20),
  },
  filterInputContainer: {
    width: "100%",
    marginBottom: mS(15),
  },
  filterLabel: {
    fontSize: mS(14),
    marginBottom: mS(5),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: mS(5),
    paddingHorizontal: mS(10),
  },
  filterIcon: {
    fontSize: mS(18),
    color: "#555",
    marginRight: mS(10),
  },
  filterInput: {
    flex: 1,
    fontSize: mS(14),
  },
  filterButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: mS(20),
  },
  filterButton: {
    flex: 1,
    padding: mS(10),
    borderRadius: mS(5),
    alignItems: "center",
    marginHorizontal: mS(5),
  },
  applyButton: {
    backgroundColor: "#4CAF50",
  },
  resetButton: {
    backgroundColor: "#FF5722",
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: mS(10),
    right: mS(10),
  },
});

export default TotalSales;