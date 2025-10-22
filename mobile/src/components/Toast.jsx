// mobile/src/components/Toast.jsx
import React from 'react';
import { View, Text } from 'react-native';

export default function Toast({ message }) {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'black',
        padding: 10,
        borderRadius: 6,
        opacity: 0.8,
      }}
    >
      <Text style={{ color: 'white' }}>{message}</Text>
    </View>
  );
}
