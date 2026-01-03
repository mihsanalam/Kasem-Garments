import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";
import LogoTitle from "@/components/inventory/LogoTitle";
import { router, useFocusEffect } from "expo-router";
import { productService } from "../service/api/product";
import { mS } from "../style/responsive";

// Helper function to format Bengali numbers
const formatBanglaNumber = (number) => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return number.toString().split('').map(digit => banglaDigits[parseInt(digit)] || digit).join('');
};

// Product Card Component for grouped products
const GroupedProductCard = ({ productGroup }) => {
  const {
    name,
    image,
    totalStockIn,
    totalStockOut,
    currentStock,
    products,
  } = productGroup;

  // Calculate total value for wholesale and retail
  const calculateTotalValue = (priceType) => {
    return products.reduce((total, product) => {
      const price = parseInt(product[priceType]) || 0;
      const quantity = parseInt(product.originalQuantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const totalWholesaleValue = calculateTotalValue('wholesalePrice');
  const totalRetailValue = calculateTotalValue('retailPrice');

  // Get valid image source
  const getImageSource = (imageValue) => {
    const defaultImage = "https://cdn-icons-png.flaticon.com/512/9486/9486994.png";
    if (!imageValue) return { uri: defaultImage };
    if (typeof imageValue === 'number') return { uri: defaultImage };
    return { uri: imageValue };
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "(tabs)/Home/productStockTable",
          params: { productName: name },
        })
      }
    >
      <View style={styles.cardContent}>
        <Image
          source={getImageSource(image)}
          style={styles.icon}
          resizeMode="contain"
        />
        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{name}</Text>
          
          <View style={styles.priceContainer}>
            <View style={styles.infoRow}>
              <Feather name="tag" style={styles.infoIcon} />
              <Text style={styles.infoText}>পাইকারি মূল্যঃ {formatBanglaNumber(totalWholesaleValue)} টাকা</Text>
            </View>
            <View style={styles.infoRow}>
              <Feather name="tag" style={styles.infoIcon} />
              <Text style={styles.infoText}>খুচরা মূল্যঃ {formatBanglaNumber(totalRetailValue)} টাকা</Text>
            </View>
          </View>

          <View style={styles.stockInfoContainer}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>স্টক ইনঃ</Text>
              <Text style={styles.stockValue}>{formatBanglaNumber(totalStockIn)} টি</Text>
            </View>

            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>স্টক আউটঃ</Text>
              <Text style={styles.stockValue}>{formatBanglaNumber(totalStockOut)} টি</Text>
            </View>

            <View
              style={[
                styles.stockItem,
                { color: currentStock > 0 ? "#2E7D32" : "#D32F2F" },
              ]}
            >
              <Text
                style={[
                  styles.stockLabel,
                  { color: currentStock > 0 ? "#2E7D32" : "#D32F2F" },
                ]}
              >
                বর্তমান স্টকঃ
              </Text>
              <Text
                style={[
                  styles.stockValue,
                  { color: currentStock > 0 ? "#2E7D32" : "#D32F2F" },
                ]}
              >
                {formatBanglaNumber(currentStock)} টি
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Product List Screen
const ProductListScreen = () => {
  const [loading, setLoading] = useState(true);
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [totalStats, setTotalStats] = useState({
    totalStockIn: 0,
    totalStockOut: 0,
    currentTotalStock: 0,
  });

  // Filter state variables
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [filterPrice, setFilterPrice] = useState("");

  // Process and group products data
  const processProductData = (products) => {
    const groupedByName = {};
    let overallTotalStockIn = 0;
    let overallTotalStockOut = 0;

    if (!Array.isArray(products)) {
      console.log('No products data available');
      return [];
    }

    products.forEach((product) => {
      if (!product || !product.name) return; // Skip invalid products

      const name = product.name.trim(); // Ensure name is trimmed
      if (name.length === 0) return; // Skip empty names

      const stockIn = parseInt(product.originalQuantity) || 0;
      const stockOut = stockIn - (parseInt(product.currentStock) || 0);
      const currentStock = parseInt(product.currentStock) || 0;

      overallTotalStockIn += stockIn;
      overallTotalStockOut += stockOut;

      if (!groupedByName[name]) {
        groupedByName[name] = {
          name,
          image: product.image || "https://cdn-icons-png.flaticon.com/512/9486/9486994.png",
          products: [],
          totalStockIn: 0,
          totalStockOut: 0,
          currentStock: 0,
        };
      }

      groupedByName[name].products.push(product);
      groupedByName[name].totalStockIn += stockIn;
      groupedByName[name].totalStockOut += stockOut;
      groupedByName[name].currentStock += currentStock;
    });

    const groupedProductsArray = Object.values(groupedByName);

    setTotalStats({
      totalStockIn: overallTotalStockIn,
      totalStockOut: overallTotalStockOut,
      currentTotalStock: overallTotalStockIn - overallTotalStockOut,
    });

    return groupedProductsArray;
  };

  // Filter products based on name and price
  const filterProducts = async () => {
    try {
      setLoading(true);
      let products = [];

      if (filterName || filterPrice) {
        if (filterName && filterPrice) {
          // Filter by both name and price
          try {
            const nameFilteredProducts = await productService.searchProductsByName(filterName.trim());
            const minPrice = parseInt(filterPrice.replace(/[^\d]/g, '')) || 0;
            products = nameFilteredProducts.filter(
              product => (parseInt(product.wholesalePrice) || 0) >= minPrice
            );
          } catch (error) {
            console.log('Error filtering by name and price:', error);
            products = [];
          }
        } else if (filterName) {
          // Filter by name only
          try {
            products = await productService.searchProductsByName(filterName.trim());
          } catch (error) {
            console.log('Error filtering by name:', error);
            products = [];
          }
        } else {
          // Filter by price only
          try {
            const minPrice = parseInt(filterPrice.replace(/[^\d]/g, '')) || 0;
            products = await productService.getProductsByPriceRange(minPrice, Number.MAX_SAFE_INTEGER);
          } catch (error) {
            console.log('Error filtering by price:', error);
            products = [];
          }
        }
      } else {
        // No filters, get all products
        products = await productService.getAllProducts();
      }

      const groupedProductsArray = processProductData(products);
      setGroupedProducts(groupedProductsArray);
    } catch (error) {
      console.log('Error in filterProducts:', error);
      setGroupedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Modal for filters
  const renderFilterModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={filterVisible}
      onRequestClose={() => setFilterVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>ফিল্টার অপশন</Text>

          <View style={styles.filterOptions}>
            <Text style={styles.filterLabel}>পণ্যের নাম</Text>
            <View style={styles.inputWrapper}>
              <AntDesign name="edit" style={styles.filterIcon} />
              <TextInput
                style={styles.filterInput}
                placeholder="পণ্যের নাম দিয়ে খুঁজুন"
                value={filterName}
                onChangeText={setFilterName}
              />
            </View>

            <Text style={[styles.filterLabel, { marginTop: mS(10) }]}>সর্বনিম্ন মূল্য</Text>
            <View style={styles.inputWrapper}>
              <AntDesign name="creditcard" style={styles.filterIcon} />
              <TextInput
                style={styles.filterInput}
                placeholder="সর্বনিম্ন মূল্য লিখুন"
                value={filterPrice}
                onChangeText={setFilterPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[styles.filterButton, styles.resetButton]}
              onPress={async () => {
                setFilterName("");
                setFilterPrice("");
                setFilterVisible(false);
                
                // Directly load all products without calling filterProducts
                try {
                  setLoading(true);
                  const products = await productService.getAllProducts();
                  const groupedProductsArray = processProductData(products);
                  setGroupedProducts(groupedProductsArray);
                } catch (error) {
                  console.log('Error resetting products:', error);
                  setGroupedProducts([]);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.filterButtonText}>রিসেট</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, styles.applyButton]}
              onPress={() => {
                filterProducts();
                setFilterVisible(false);
              }}
            >
              <Text style={styles.filterButtonText}>প্রয়োগ</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFilterVisible(false)}
          >
            <AntDesign name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Fetch products when component mounts
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const products = await productService.getAllProducts();
          const groupedProductsArray = processProductData(products);
          setGroupedProducts(groupedProductsArray);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <LogoTitle title="পণ্যের স্টক" otherStyle={{ marginLeft: mS(10) }} />
          </View>
          <TouchableOpacity onPress={() => setFilterVisible(true)}>
            <AntDesign name="filter" style={styles.filterIconHeader} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stock Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>স্টক ইন</Text>
          <Text style={styles.statValue}>{formatBanglaNumber(totalStats.totalStockIn)} টি</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statTitle}>স্টক আউট</Text>
          <Text style={styles.statValue}>{formatBanglaNumber(totalStats.totalStockOut)} টি</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              borderLeftColor:
                totalStats.currentTotalStock > 0 ? "#4CAF50" : "#F44336",
            },
          ]}
        >
          <Text style={styles.statTitle}>বর্তমান স্টক</Text>
          <Text
            style={[
              styles.statValue,
              {
                color:
                  totalStats.currentTotalStock > 0 ? "#1B5E20" : "#B71C1C",
              },
            ]}
          >
            {formatBanglaNumber(totalStats.currentTotalStock)} টি
          </Text>
        </View>
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>ডাটা লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          data={groupedProducts}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => <GroupedProductCard productGroup={item} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>কোন পণ্য পাওয়া যায়নি</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: mS(40),
  },
  header: {
    marginBottom: mS(10),
    marginTop: mS(20),
    marginHorizontal: mS(10),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: mS(16),
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
  listContainer: {
    padding: mS(16),
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: mS(16),
    paddingVertical: mS(8),
    paddingHorizontal: mS(16),
    elevation: mS(2),
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    width: mS(50),
    height: mS(50),
    marginRight: mS(16),
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
  },
  productName: {
    fontSize: mS(16),
    fontWeight: "bold",
    marginBottom: mS(8),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: mS(6),
  },
  infoIcon: {
    fontSize: mS(16),
    color: "#333",
    marginRight: mS(6),
  },
  infoText: {
    fontSize: mS(14),
    marginRight: mS(10),
  },
  priceContainer: {
    marginBottom: mS(6),
  },
  stockInfoContainer: {
    marginTop: mS(6),
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: mS(6),
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: mS(3),
  },
  stockLabel: {
    fontSize: mS(14),
    fontWeight: "500",
    color: "#333",
  },
  stockValue: {
    fontSize: mS(14),
    fontWeight: "bold",
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
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
  filterOptions: {
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
    padding: mS(8),
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
  filterIconHeader: {
    fontSize: mS(30),
    color: "#4CAF50",
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

export default ProductListScreen;