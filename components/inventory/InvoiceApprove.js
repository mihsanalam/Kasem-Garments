import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { rS, vS, mS } from '@/style/responsive';

const InvoiceApproveSection = ({data, invoiceData}) => {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Icon name="check" style={styles.CheckIcon} />
        <Text style={styles.approvedText}>Approved</Text>
        <Text style={styles.invoiceText}>Invoice</Text>
      </View>

      <View style={styles.signatures}>
        <View style={styles.propitorSignature}>
          <Text style={styles.name}>                            </Text>
          <View style={styles.signatureLine}>
            <Text style={[styles.signatureLabel, {marginLeft: mS(35)}]}>ক্রেতার স্বাক্ষর</Text>
          </View>
        </View>

        <View style={styles.propitorSignature}>
          <Text style={styles.name}>                            </Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>মেমো প্রস্তুতকারক</Text>
          </View>
        </View>
      </View>

      <View style={styles.address}>
        <Text style={styles.addressText}>শহীদ ডা. শামসুল হক সড়ক, সৈয়দপুর, নীলফামারী</Text>
        <Text style={styles.mobileNumber}>মোবাইলঃ ০১৭১২-০০০৬৯৯ • আরজুঃ ০১৭১২-০০০৬৯৯ • রওনকঃ ০১৭১২-০০০৬৯৯</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: mS(18),
  },
  CheckIcon: {
    fontSize: mS(50),
    color: '#4CAF50',
  },
  circle: {
    width: vS(160),
    height: vS(160),
    borderRadius: '50%',
    borderWidth: 5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: mS(10),
  },
  approvedText: {
    fontSize: mS(24),
    fontWeight: 'bold',
    marginBottom: mS(5),
  },
  invoiceText: {
    fontSize: mS(14),
    color: '#757575',
  },
  propitorSignature: {
    // not need any style
  },
  signatures: {
    marginTop: mS(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: mS(20),
  },
  signatureLine: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#BDBDBD',
    paddingBottom: mS(5),
  },
  signatureLabel: {
    fontSize: mS(12),
    marginLeft: mS(25),
    color: '#757575',
  },
  name: {
    fontSize: mS(16),
    fontWeight: 'bold',
    marginHorizontal: mS(10),
  },
  address: {
    alignItems: 'center',
  },
  addressText: {
    fontSize: mS(13),
    color: '#757575',
    textAlign: 'center',
  },
  mobileNumber: {
    fontSize: mS(9),
    color: '#757575',
    textAlign: 'center',
  },
});

export default InvoiceApproveSection;