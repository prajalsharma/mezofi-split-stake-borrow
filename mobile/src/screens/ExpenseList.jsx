import React from 'react';
import { View, Text, FlatList } from 'react-native';

export default function ExpenseList({ route }) {
  const { userId, tripId } = route.params || {};
  const [expenses, setExpenses] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      // TODO: fetch expenses by user and/or trip
      setExpenses([]);
    })();
  }, [userId, tripId]);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text>Expenses</Text>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 5 }}>
            <Text>{item.merchant} - 5{item.amount_fiat}</Text>
            <Text>Category: {item.category}</Text>
          </View>
        )}
      />
    </View>
  );
}
