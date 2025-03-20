import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { rS, vS, mS } from "@/style/responsive";

const InputField = ({
  title,
  placeholder,
  iconName,
  value,
  onChangeText,
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
          onChangeText={onChangeText}
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
    marginBottom: mS(10),
  },
  title: {
    fontSize: mS(15),
    marginBottom: mS(5),
    color: '#202634',
    marginLeft: mS(5),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: rS(300),
    backgroundColor: '#FFFFFF',
    borderColor: '#D3D3D3',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: mS(12),
    paddingVertical: mS(2),
  },
  icon: {
    fontSize: mS(20),
    color: '#757575',
    marginRight: mS(8),
    marginLeft: mS(5),
  },
  input: {
    width: rS(220),
    fontSize: mS(14),
    color: 'black',
    flex: 1,
  },
});

export default InputField;