import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { mS, rS, vS } from "@/style/responsive";

const ArrowTitle = ({ title }) => {
    return (
        <View style={styles.container}>
            {/* <View style={styles.iconContainer}>
                <IconSymbol name="arrow.left" style={styles.icon} />
            </View> */}
            <Text style={styles.screenTitle}>{title}</Text>
        </View>
    );
};

export default ArrowTitle

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: mS(20),
    },
    iconContainer: {
        backgroundColor: "#f9fafb",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#eaecef",
        height: mS(45),
        width: mS(45),
        justifyContent: "center",
        alignItems: "center",
    },
    icon: {
        fontSize: mS(24),
        color: 'black',
    },
    screenTitle: {
        marginLeft: mS(10),
        fontSize: mS(26),
        fontWeight: "600",
      },
}); 