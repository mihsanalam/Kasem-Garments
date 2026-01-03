import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from "react-native";
import { rS, vS, mS } from "@/style/responsive";
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from 'expo-media-library';

const INVOICES_STORAGE_KEY = "invoices_data";

const DealsCard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Fetch products from SecureStore when component mounts
    useFocusEffect(
        React.useCallback(() => {
            const fetchProducts = async () => {
                try {
                    setLoading(true);
                    const storedProductsJson = await SecureStore.getItemAsync(
                        INVOICES_STORAGE_KEY
                    );
        
                    if (storedProductsJson) {
                        const storedProducts = JSON.parse(storedProductsJson);
                        setProducts(storedProducts);
                        console.log(31, "Products fetched from SecureStore:", storedProducts);
                    } else {
                        console.log("No products found in SecureStore");
                        setProducts([]);
                    }
                } catch (error) {
                    console.error("Error fetching products from SecureStore:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProducts();
        }, [])
    );

    const downloadPDF = async () => {
        try {
            // Check if products are available
            if (products.length === 0) {
                Alert.alert('No Data', 'No products available to download');
                return;
            }
            
            // Generate PDF content
            let htmlContent = `
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: 'Arial'; padding: 20px; }
                            h1 { color: #4caf50; text-align: center; }
                            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #4caf50; color: white; }
                        </style>
                    </head>
                    <body>
                        <h1>Products Report</h1>
                        <div class="header">
                            <p>Name: আহমেদ হোসেন</p>
                            <p>Serial: ৫০২</p>
                            <p>Location: সরিষাবাড়ী, জামালপুর, ময়মনসিংহ</p>
                            <p>Date: ${new Date().toLocaleDateString()}</p>
                        </div>
                        <table>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Date</th>
                                <th>Total</th>
                            </tr>
            `;
            
            // Add product rows
            let totalAmount = 0;
            products.forEach(product => {
                const productTotal = parseInt(product.price) * parseInt(product.quantity);
                totalAmount += productTotal;
                
                htmlContent += `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.price}</td>
                        <td>${product.quantity}</td>
                        <td>${product.date}</td>
                        <td>${productTotal}</td>
                    </tr>
                `;
            });
            
            // Add total row and close HTML
            htmlContent += `
                        <tr>
                            <td colspan="4" style="text-align: right; font-weight: bold;">Total Amount:</td>
                            <td style="font-weight: bold;">${totalAmount}</td>
                        </tr>
                    </table>
                </body>
                </html>
            `;
            
            // Generate PDF from HTML
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });
            
            if (Platform.OS === 'android') {
                try {
                    // On Android, request permission to pick a directory to save the file
                    console.log("Requesting directory permission...");
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    
                    if (permissions.granted) {
                        const pdfName = `products_report_${Date.now()}.pdf`;
                        console.log("Creating file:", pdfName);
                        
                        // Create the file in the selected directory
                        const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
                            permissions.directoryUri,
                            pdfName,
                            'application/pdf'
                        );
                        
                        console.log("File created at:", destinationUri);
                        
                        // Read the content of the generated PDF
                        const fileContent = await FileSystem.readAsStringAsync(uri, { 
                            encoding: FileSystem.EncodingType.Base64 
                        });
                        
                        console.log("Read file content, length:", fileContent.length);
                        
                        // Write the content to the new file
                        await FileSystem.writeAsStringAsync(
                            destinationUri, 
                            fileContent, 
                            { encoding: FileSystem.EncodingType.Base64 }
                        );
                        
                        console.log("File written successfully");
                        Alert.alert('Success', 'PDF downloaded successfully!');
                    } else {
                        console.log("Permission not granted");
                        Alert.alert('Permission Denied', 'We need permission to save the file to your device.');
                    }
                } catch (error) {
                    console.error('Download error:', error);
                    Alert.alert('Error', 'Failed to download PDF. Please try again.');
                }
            } else {
                // For iOS, direct download not possible outside app sandbox
                // We have to use sharing which includes "Save to Files" option
                await Sharing.shareAsync(uri, {
                    UTI: 'com.adobe.pdf',
                    mimeType: 'application/pdf'
                });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
    };
            
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    <Image
                        style={styles.image}
                        source={{ uri: "https://cdn-icons-png.flaticon.com/128/3899/3899160.png" }}
                    />
                </View>
                <Text style={styles.title}>আহমেদ হোসেন</Text>
                <Text style={styles.serialNumber}>সিরিয়াল : ৫০২</Text>
                <View style={styles.locationContainer}>
                    <Icon name="map-marker" style={styles.icon} />
                    <Text style={styles.location}>সরিষাবাড়ী, জামালপুর, ময়মনসিংহ</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.iconContainer} onPress={downloadPDF}>
                <Icon name="download" style={styles.uparrowicon} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: mS(12),
        paddingHorizontal: mS(14),
        borderRadius: 15,
        backgroundColor: "white",
        borderColor: "#4caf50",
        borderWidth: 1,
        marginBottom: mS(16),
    },
    content: {
        flexDirection: 'column',
    },
    imageContainer: {
        marginBottom: mS(8),
    },
    image: {
        width: rS(30),
        height: vS(30),
        borderRadius: mS(8),
    },
    title: {
        fontSize: mS(18),
        fontWeight: "bold",
        marginBottom: mS(2),
    },
    serialNumber: {
        fontSize: mS(12),
        color: "gray",
        marginBottom: mS(2),
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: mS(6),
    },
    location: {
        fontSize: mS(14),
        color: "black",
    },
    icon: {
        fontSize: mS(14),
        color: "black",
    },
    iconContainer: {
        height: vS(30),
        width: rS(35),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4caf50',
        borderRadius: 10,
        marginTop: mS(70),
        marginLeft: mS(60),
    },
    uparrowicon: {
        fontSize: mS(20),
        color: "white",
        fontWeight: "100"
    }
});

export default DealsCard;