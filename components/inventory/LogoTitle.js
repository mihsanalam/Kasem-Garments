import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { rS, vS, mS } from "@/style/responsive";

const LogoTitle = ({title, otherStyle}) => {
    return (
        <View style={[styles.container, otherStyle]}>
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>ক</Text>
            </View>
            <Text style={styles.screenName}>{title}</Text>
        </View>

    );
};

export default LogoTitle;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: mS(10),
        // marginLeft: mS(10),
    },
    logoContainer: {
        backgroundColor: "#4CAF50",
        borderRadius: 10,
        width: rS(35),
        height: rS(35),
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        color: "white",
        fontSize: rS(20),
        fontWeight: "bold",        
    },
    screenName: {
        marginLeft: mS(10),
        fontSize: mS(26),
        fontWeight: "600",
      },

    }
);