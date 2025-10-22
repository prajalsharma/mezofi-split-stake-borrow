import React from 'react';
import { View, Text, Button, TextInput, FlatList } from 'react-native';

export default function TripCreate({ navigation }) {
  const [title, setTitle] = React.useState('');
  const [currency, setCurrency] = React.useState('INR');

  const createTrip = async () => {
    try {
      let res = await fetch('http://localhost:3000/api/trip/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator: 'alice', title, currency }),
      });
      let json = await res.json();
      if (json.success) {
        alert('Trip created: ' + json.trip.title);
        navigation.goBack();
      } else {
        alert('Failed to create trip');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Create a Trip</Text>
      <TextInput
        placeholder="Trip Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderBottomWidth: 1, marginVertical: 12 }}
      />
      <Button title="Create Trip" onPress={createTrip} />
    </View>
  );
}
