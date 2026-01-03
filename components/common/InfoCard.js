// import React from "react";
// import { View, Text, StyleSheet, Image } from "react-native";

// const InfoCard = ({ title, description, src }) => {
//     return (
//         <View style={styles.container}>
//             <View style={styles.imageContainer}>

//                 <Image
//                     src={src}
//                     style={styles.image}
//                 />

//             </View>
//             <Text style={styles.title}>{title}</Text>
//             <Text style={styles.description}>{description}</Text>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         // padding: 16,
//         paddingVertical: 16,
//         paddingHorizontal: 20,
//         borderRadius: 30,
//         backgroundColor: "white",
//         borderColor: "#4caf50",
//         borderWidth: 1,
//         marginBottom: 16,
//     },
//     imageContainer: {
//         marginBottom: 8,
//     },
//     image: {
//         width: 40,
//         height: 40,
//         borderRadius: 8,
//     },
//     title: {
//         fontSize: 20,
//         fontWeight: "600",
//         marginBottom: 5,
//     },
//     description: {
//         fontSize: 18,
//         color: "black",
//     },
// });

// export default InfoCard;








import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Icon from '@expo/vector-icons/FontAwesome';
import { rS, vS, mS } from "@/style/responsive";

const InfoCard = ({ title, description, source, otherStyle }) => {
    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={[styles.imageContainer , otherStyle]}>
                    <Image source={source} style={styles.image} />
                    {/* <Image source={source} style={styles.image} /> */}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </View>
            <View style={styles.iconContainer}>
                <Icon name="arrow-up" style={styles.uparrowicon} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: mS(16),
        paddingHorizontal: mS(14),
        borderRadius: 30,
        backgroundColor: "white",
        borderColor: "#4caf50",
        borderWidth: 1,
        marginBottom: mS(16),
    },
    contentContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: mS(8),
    },
    imageContainer: {
        marginRight: mS(150),
        marginBottom: mS(8),
    },
    image: {
        width: rS(45),
        height: vS(45),
        borderRadius: 8,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: mS(20),
        fontWeight: "600",
        marginBottom: mS(5),
    },
    description: {
        fontSize: mS(18),
        color: "black",
    },
    iconContainer: {
        padding: mS(15),
        transform: [{ rotate: '45deg' }],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4caf50',
        borderRadius: 50,
        marginTop: mS(-60)
    },
    uparrowicon: {
        fontSize: mS(25),
        color: "white",
        fontWeight: "100"
    }
});

export default InfoCard;