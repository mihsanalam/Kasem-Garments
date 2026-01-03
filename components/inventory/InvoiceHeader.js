import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rS, vS, mS } from '@/style/responsive';

const InvoiceHeader = () => {
    return (
        <View style={styles.header}>
            <View style={styles.titleContainer}>
                <Text style={styles.screenName}>মেসার্স কাসেম গার্মেন্টস</Text>
                <Text style={styles.proprietorName}>প্রোপাইটর : মোহাম্মাদ কাসেম</Text>
            </View>

            <View style={styles.logoContainer}>
                <Text style={styles.logo}>ক</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        marginTop: mS(10),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    logoContainer: {
        backgroundColor: "#4CAF50",
        borderRadius: 10,
        width: rS(45),
        height: rS(45),
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        color: "white",
        fontSize: rS(24),
        fontWeight: "bold",
    },
    titleContainer: {
        marginLeft: mS(-8),
    },
    screenName: {
        marginLeft: mS(10),
        fontSize: mS(24),
        fontWeight: "600",
    },
    proprietorName: {
        marginLeft: mS(10),
        fontSize: mS(14),
        fontWeight: "400",
    },
});

export default InvoiceHeader;