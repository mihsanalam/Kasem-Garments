import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rS, vS, mS } from "@/style/responsive";
import InvoiceHeader from "../components/inventory/InvoiceHeader";
import InvoiceTable from "../components/inventory/InvoiceTable";
import InvoiceApproveSection from "../components/inventory/InvoiceApprove";

const InvoiceScreen = () => {
    const [data, setData] = React.useState([]);
    const [invoiceData, setInvoiceData] = React.useState([]);
    console.log(11, data)
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.container}>
                    <InvoiceHeader />
                    {/* <View style={styles.CustomerData}>
                        <InvoiceCustomerData />
                    </View> */}
                    <View style={styles.ProductData}>
                        <InvoiceTable data={data} setData={setData} invoiceData={invoiceData} setInvoiceData={setInvoiceData} />
                    </View>

                    <View style={styles.ApproveSection}>
                        <InvoiceApproveSection data={data} invoiceData={invoiceData}/>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "white",
    },
    scrollContainer: {
        flexGrow: mS(1),
        paddingBottom: mS(20),
        // alignItems: 'center',
    },
    container: {
        paddingHorizontal: mS(20),
        width: "100%",
        // alignItems: 'center',
    },
    CustomerData: {
        marginTop: mS(20),
    },
    ProductData: {
        marginTop: mS(10),
    },
    ApproveSection: {
        // marginTop: mS(20),
    }


});

export default InvoiceScreen;



// import React from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';

// const InvoiceScreen = () => {
//   return (
//     <ScrollView style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.header}>
//         <Text style={styles.businessName}>মেসার্স কাসেম গার্মেন্টস</Text>
//         <Text style={styles.proprietorName}>প্রোরহিটন : মোহাম্মাদ কাসেম</Text>
//         <View style={styles.invoiceDetails}>
//           <Text>ক্রমিক নয়: ৮৯৭৬</Text>
//           <Text>নাম: মোহাম্মাদ কাসেম</Text>
//           <Text>তারিখঃ ০৪/০১/২০২০</Text>
//         </View>
//       </View>

//       {/* Table Section */}
//       <View style={styles.table}>
//         <View style={styles.tableHeader}>
//           <Text style={styles.headerCell}>নং</Text>
//           <Text style={styles.headerCell}>বিবরণ</Text>
//           <Text style={styles.headerCell}>মূল্য</Text>
//           <Text style={styles.headerCell}>পরিমাণ</Text>
//           <Text style={styles.headerCell}>মোট</Text>
//         </View>
//         {/* Data Rows (Add your data here) */}
//         <View style={styles.dataRow}>
//           <Text style={styles.dataCell}>০১</Text>
//           <Text style={styles.dataCell}>পণ্যের নাম</Text>
//           <Text style={styles.dataCell}>৪০০ টাকা</Text>
//           <Text style={styles.dataCell}>১ টি</Text>
//           <Text style={styles.dataCell}>৪০০ টাকা</Text>
//         </View>
//         {/* Add more data rows */}
//       </View>

//       {/* Summary Section */}
//       <View style={styles.summary}>
//         <View style={styles.summaryRow}>
//           <Text>ফেরত পণা</Text>
//           <Text>০.০০ টাকা</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text>সর্বমোট</Text>
//           <Text>০.০০ টাকা</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text>পূর্বের বাকি</Text>
//           <Text>৪,০০০ টাকা</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text>জমা</Text>
//           <Text>৯,০০০ টাকা</Text>
//         </View>
//         <View style={styles.summaryRow}>
//           <Text>বাকি</Text>
//           <Text>৩,০০০ টাকা</Text>
//         </View>
//         <Text style={styles.amountInWords}>তিন হাজার টাকা মাত্র</Text>
//       </View>

//       {/* Approval Section */}
//       <View style={styles.approval}>
//         <Text style={styles.approved}>Approved invoice</Text>
//       </View>

//       {/* Signatures Section */}
//       <View style={styles.signatures}>
//         <Text>ক্রেতার স্বাক্ষর</Text>
//         <Text>মোমা প্রস্তুতকারক</Text>
//       </View>

//       {/* Address and Contact Section */}
//       <View style={styles.addressContact}>
//         <Text>শহীদ ডা . শামসুল হক সড়ক , সৈয়দপুর , নীলফামারী</Text>
//         <Text>মোবাইলঃ ০০৭২২-০০০১৯৯</Text>
//       </View>

//       {/* Print Button */}
//       <View style={styles.printButton}>
//         <Text style={styles.printButtonText}>প্রিন্ট করুন</Text>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//   },
//   header: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   businessName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   proprietorName: {
//     fontSize: 16,
//   },
//   invoiceDetails: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: 8,
//   },
//   table: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 4,
//     marginBottom: 16,
//   },
//   tableHeader: {
//     flexDirection: 'row',
//     backgroundColor: '#f0f0f0',
//   },
//   headerCell: {
//     flex: 1,
//     padding: 8,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     borderRightWidth: 1,
//     borderColor: '#ddd',
//   },
//   dataRow: {
//     flexDirection: 'row',
//     borderBottomWidth: 1,
//     borderColor: '#ddd',
//   },
//   dataCell: {
//     flex: 1,
//     padding: 8,
//     textAlign: 'center',
//     borderRightWidth: 1,
//     borderColor: '#ddd',
//   },
//   summary: {
//     marginBottom: 16,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 4,
//   },
//   amountInWords: {
//     fontWeight: 'bold',
//     marginTop: 8,
//   },
//   approval: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   approved: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   signatures: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   addressContact: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   printButton: {
//     backgroundColor: '#4CAF50',
//     padding: 12,
//     borderRadius: 4,
//     alignItems: 'center',
//   },
//   printButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
// });

// export default InvoiceScreen;