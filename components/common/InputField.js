import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { rS, vS, mS } from "@/style/responsive";

const InputField = ({
  title,
  placeholder,
  iconName,
  value,
  handleChangeText,
  editable = true,
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.inputContainer}>
        <FontAwesome name={iconName} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={handleChangeText}
          editable={editable}
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: mS(10),
    // marginLeft: mS(5),
  },
  title: {
    fontSize: mS(15),
    marginBottom: mS(5),
    color: 'black',
    marginLeft: mS(5),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    justifyContent: 'center',
    // height: mS(50),
    width: rS(300),
    backgroundColor: '#FFFFFF',
    borderColor: '#D3D3D3',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: mS(12),
    paddingVertical: mS(4),
  },
  icon: {
    fontSize: mS(20),
    color: '#757575',
    marginRight: mS(8),
    marginLeft: mS(5),
  },
  input: {
    // height: mS(40),
    width: mS(220),
    fontSize: mS(14),
    color: '#333',
    flex: 1,
  },
});

export default InputField;