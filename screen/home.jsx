import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const DashboardScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View
        style={{
          marginBottom: 20,
          marginTop: 10,
          marginLeft: 10,
          marginRight: 10,
        }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.appIconContainer}>
            <Text style={styles.appIconText}>ক</Text>
          </View>
          <Text style={styles.headerTitle}>ডাশবোর্ড</Text>
        </View>
        <View style={styles.profileContainer}>
          <Image
            source={{
              uri: "https://gratisography.com/wp-content/uploads/2025/03/gratisography-funny-dog-1036x780.jpg",
            }}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.welcomeText}>হ্যালো,</Text>
            <Text style={styles.nameText}>আহসান মোসেন</Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <Text style={styles.sectionTitle}>অভিব্যক্তি</Text>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("(tabs)/Home/productStock")}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.cardIcon}
                  defaultSource={require("../assets/images/icon.png")}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>পণ্যের স্টক</Text>
                <Text style={styles.cardSubtitle}>যে পরিমাণ পণ্য মজুত আছে</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Card 2 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("(tabs)/Home/returnStockTable")}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.cardIcon}
                  defaultSource={require("../assets/images/icon.png")}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>ফেরত মালের স্টক</Text>
                <Text style={styles.cardSubtitle}>
                  যে পরিমাণ পণ্য ফেরত যোগ্য
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Card 3 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("(tabs)/Home/totalSales")}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.cardIcon}
                  defaultSource={require("../assets/images/icon.png")}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>মোট বিক্রি</Text>
                <Text style={styles.cardSubtitle}>
                  যে পরিমাণ পণ্য ফেরত যোগ্য
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  appIconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 16,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  cardTextContainer: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  arrowContainer: {
    padding: 4,
  },
  reviewSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  starIcon: {
    marginRight: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  savedReviews: {
    marginTop: 24,
  },
  reviewItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ratingDisplay: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewText: {
    fontSize: 14,
  },
});

export default DashboardScreen;
