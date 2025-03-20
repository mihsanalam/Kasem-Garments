import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import LogoTitle from "@/components/inventory/LogoTitle";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

// Define the storage key constants
const PRODUCTS_STORAGE_KEY = "product_data";
const INVOICES_STORAGE_KEY = "invoices_data";

// Product Card Component
const ProductCard = ({ product, stockOut }) => {
  // Stock In is the original product quantity (never changes)
  const stockIn = parseInt(product.originalQuantity || product.quantity) || 0;
  
  // Stock Out is the total sold in invoices
  const stockOutValue = stockOut || 0;
  
  // Current Stock is Stock In minus Stock Out
  const currentStock = stockIn - stockOutValue;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push("(tabs)/Home/productStockTable")}
    >
      <View style={styles.cardContent}>
        {/* Product Icon */}
        <Image
          source={{
            uri: product.image || "https://cdn-icons-png.flaticon.com/512/9486/9486994.png",
          }}
          style={styles.icon}
          resizeMode="contain"
        />

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Date */}
          <View style={styles.infoRow}>
            <Feather
              name="calendar"
              size={16}
              color="#333"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{product.date}</Text>
          </View>

          {/* Price Information */}
          <View style={styles.infoRow}>
            <Feather
              name="tag"
              size={16}
              color="#333"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>মূল্যঃ {product.price}</Text>
          </View>

          {/* Stock Information */}
          <View style={styles.stockInfoContainer}>
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>স্টক ইনঃ</Text>
              <Text style={styles.stockValue}>{stockIn}</Text>
            </View>
            
            <View style={styles.stockItem}>
              <Text style={styles.stockLabel}>স্টক আউটঃ</Text>
              <Text style={styles.stockValue}>{stockOutValue}</Text>
            </View>
            
            <View style={styles.stockItem}>
              <Text style={[styles.stockLabel, {color: currentStock > 0 ? '#2E7D32' : '#D32F2F'}]}>বর্তমান স্টকঃ</Text>
              <Text style={[styles.stockValue, {color: currentStock > 0 ? '#2E7D32' : '#D32F2F'}]}>{currentStock}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Product List Screen
const ProductListScreen = () => {
  // State for storing product data from SecureStore
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockStats, setStockStats] = useState({});
  const [totalStats, setTotalStats] = useState({
    totalStockIn: 0,
    totalStockOut: 0,
    currentTotalStock: 0
  });

  // Calculate stock out quantities from invoices
  const calculateStockOut = (productsData, invoicesData) => {
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
    
    setStockStats(stockOutMap);
    
    // Calculate total stock in and out for stats
    let totalStockIn = 0;
    let totalStockOut = 0;
    
    // Make sure each product has an originalQuantity field
    const productsWithOriginalQuantity = productsData.map(product => {
      // If product doesn't have originalQuantity, add it
      if (!product.hasOwnProperty('originalQuantity')) {
        return {
          ...product,
          originalQuantity: product.quantity
        };
      }
      return product;
    });
    
    // Use the updated products with originalQuantity
    productsWithOriginalQuantity.forEach(product => {
      // Original product quantity is Stock In
      const stockIn = parseInt(product.originalQuantity || product.quantity) || 0;
      totalStockIn += stockIn;
      
      // Sold quantity is Stock Out
      const stockOut = stockOutMap[product.id] || 0;
      totalStockOut += stockOut;
    });
    
    const currentTotalStock = totalStockIn - totalStockOut;
    
    setTotalStats({
      totalStockIn,
      totalStockOut,
      currentTotalStock
    });
    
    return {
      stockOutMap,
      productsWithOriginalQuantity
    };
  };

  // Fetch products from SecureStore when component mounts
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
            console.log("Products fetched from SecureStore:", productsData);
          } else {
            console.log("No products found in SecureStore");
          }
          
          // Fetch invoices
          const storedInvoicesJson = await SecureStore.getItemAsync(
            INVOICES_STORAGE_KEY
          );
          
          let invoicesData = [];
          if (storedInvoicesJson) {
            invoicesData = JSON.parse(storedInvoicesJson);
            setInvoices(invoicesData);
            console.log("Invoices fetched from SecureStore:", invoicesData);
          } else {
            console.log("No invoices found in SecureStore");
            setInvoices([]);
          }
          
          // Calculate stock statistics and update products with originalQuantity
          const { stockOutMap, productsWithOriginalQuantity } = calculateStockOut(productsData, invoicesData);
          
          // Update the products with originalQuantity field
          setProducts(productsWithOriginalQuantity);
          
          // Save the updated products with originalQuantity back to SecureStore
          await SecureStore.setItemAsync(
            PRODUCTS_STORAGE_KEY,
            JSON.stringify(productsWithOriginalQuantity)
          );
          
        } catch (error) {
          console.error("Error fetching data from SecureStore:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }, [])
  );

  // Sample fallback product data (used only if no data in SecureStore)
  const sampleProducts = [
    {
      id: "1",
      name: "পুরুষদের জন্য ক্যাশুয়েল টি-শার্ট",
      date: "০৪/০১/২০২৫",
      price: "৫৫০",
      quantity: "১২০",
      originalQuantity: "১২০",
      image: "https://cdn-icons-png.flaticon.com/512/9486/9486994.png",
    },
    {
      id: "2",
      name: "মহিলাদের শাড়ি",
      date: "০৪/০১/২০২৫",
      price: "১২০০",
      quantity: "৫০",
      originalQuantity: "৫০",
      image: "https://cdn-icons-png.flaticon.com/512/9486/9486994.png",
    },
    {
      id: "3",
      name: "লেডিস হ্যান্ডব্যাগ",
      date: "০৪/০১/২০২৫",
      price: "৮৫০",
      quantity: "৩০",
      originalQuantity: "৩০",
      image: "https://cdn-icons-png.flaticon.com/512/9486/9486994.png",
    },
  ];

  // Display products from SecureStore or fallback to sample data if empty
  const displayProducts = products.length > 0 ? products : sampleProducts;

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

      {/* Show stock stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>স্টক ইন</Text>
          <Text style={styles.statValue}>{totalStats.totalStockIn} টি</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>স্টক আউট</Text>
          <Text style={styles.statValue}>{totalStats.totalStockOut} টি</Text>
        </View>
        
        <View style={[styles.statCard, 
          {borderLeftColor: totalStats.currentTotalStock > 0 ? '#4CAF50' : '#F44336'}]}>
          <Text style={styles.statTitle}>বর্তমান স্টক</Text>
          <Text style={[styles.statValue, 
            {color: totalStats.currentTotalStock > 0 ? '#1B5E20' : '#B71C1C'}]}>
            {totalStats.currentTotalStock} টি
          </Text>
        </View>
      </View>

      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            stockOut={stockStats[item.id] || 0}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>কোন পণ্য পাওয়া যায়নি</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 16,
    padding: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 16,
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    marginRight: 10,
  },
  stockInfoContainer: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 6,
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default ProductListScreen;