import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { rS, vS, mS } from "@/style/responsive";

const SaleTable = () => {

    // const data = [
    //     { sl: '৫০২', productName: 'পুরুষদের জন্য ফ্যাশনেবল টি-শার্ট', quantity: '১০০', price: '৮৮০০' },
    //     { sl: '৫০২', productName: 'পুরুষদের জন্য ফ্যাশনেবল টি-শার্ট', quantity: '১০০', price: '৮৮০০' },
    //     { sl: '৫০২', productName: 'পুরুষদের জন্য ফ্যাশনেবল টি-শার্ট', quantity: '১০০', price: '৮৮০০' },
    //     { sl: '৫০২', productName: 'পুরুষদের জন্য ফ্যাশনেবল টি-শার্ট', quantity: '১০০', price: '৮৮০০' },
    //     { sl: '৫০২', productName: 'পুরুষদের জন্য ফ্যাশনেবল টি-শার্ট', quantity: '১০০', price: '৮৮০০' },
    //     { sl: '৫০২', productName: 'পুরুষদের জন্য ফ্যাশনেবল টি-শার্ট', quantity: '১০০', price: '৮৮০০' },
    // ];

    const convertDigits = (num, fromDigits, toDigits) => {
        return num
            .toString()
            .split('')
            .map((digit) => {
                const index = fromDigits.indexOf(digit);
                return index !== -1 ? toDigits[index] : digit;
            })
            .join('');
    };

    const bengaliToArabic = (num) => {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return convertDigits(num, bengaliDigits, arabicDigits);
    };

    const totalSale = data.reduce((acc, item) => {
        const arabicPriceString = bengaliToArabic(item.price.replace(/,/g, ''));
        const price = parseFloat(arabicPriceString);

        if (!isNaN(price)) {
            return acc + price;
        } else {
            console.warn(`Invalid price: ${item.price}`);
            return acc;
        }
    }, 0);

    const arabicToBengali = (num) => {
        const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return convertDigits(num, arabicDigits, bengaliDigits);
    };

    return (
        <ScrollView horizontal={true}>
            <View style={styles.table}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerCell}>সিরিয়াল</Text>
                    <Text style={styles.headerCell}>ফেরত পণ্যের নাম</Text>
                    <Text style={styles.headerCell}>পরিমাণ</Text>
                    <Text style={styles.headerCell}>মূল্য</Text>
                </View>
                {data.map((item, index) => (
                    <View style={styles.dataRow} key={index}>
                        <Text style={styles.dataCell}>{item.sl}</Text>
                        <Text style={styles.dataCell}>{item.productName}</Text>
                        <Text style={styles.dataCell}>{item.quantity}</Text>
                        <Text style={styles.dataCell}>{item.price}</Text>
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>মোট বিক্রি</Text>
                    <Text style={styles.totalValue}>{arabicToBengali(totalSale)}</Text>
                </View>
                <View style={styles.bottomBorder} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    table: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        margin: mS(15),
        width: '100%',
        alignSelf: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#4caf50',
    },
    dataRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    headerCell: {
        flex: 1,
        padding: mS(10),
        fontWeight: '600',
        textAlign: 'center',
        borderRightWidth: 1,
        borderColor: '#4caf50',
        color: 'white',
    },
    dataCell: {
        flex: 1.2,
        padding: mS(9),
        textAlign: 'center',
        borderRightWidth: 1,
        borderColor: '#ddd',
    },
    bottomBorder: {
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: mS(10),
    },
    totalLabel: {
        fontWeight: 'bold',
        marginRight: mS(10),
    },
    totalValue: {
        fontWeight: '600',
    },
});

export default SaleTable;