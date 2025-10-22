import React, { useState } from 'react';
import { View, Button, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ExpenseUpload({ route, navigation }) {
  const { userId, tripId } = route.params;
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadReceipt = async () => {
    if (!image) {
      Alert.alert('Please select an image first');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('tripId', tripId || '');
    formData.append('image', {
      uri: image.uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    });

    try {
      const res = await fetch('http://localhost:3000/api/expense/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Expense recorded');
        navigation.goBack();
      } else {
        Alert.alert('Failed to record expense');
      }
    } catch (e) {
      Alert.alert('Network error');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="Pick Receipt Image" onPress={pickImage} />
      {image && <Image source={{ uri: image.uri }} style={{ width: 300, height: 300, marginVertical: 20 }} />}
      <Button title="Upload Expense" onPress={uploadReceipt} />
    </View>
  );
}
