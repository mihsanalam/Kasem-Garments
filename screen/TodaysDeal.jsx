import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rS, vS, mS } from "@/style/responsive";
import ArrowTitle from "../components/common/ArrowTitle";
import DealsCard from "../components/inventory/DealsCard";

const TodaysDealScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.container}>
                    <ArrowTitle
                        title="আজকের বিক্রি"
                    />

                    <DealsCard />


                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default TodaysDealScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContainer: {
        flexGrow: mS(1),
        paddingBottom: mS(20),
    },
    container: {
        paddingVertical: mS(10),
        paddingHorizontal: mS(20),
        width: "100%",
    },
});