import React from 'react';
import { View, Text, FlatList } from 'react-native';

export default function LoanDetails({ route }) {
  const { userId } = route.params;
  const [loans, setLoans] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      // TODO: fetch user loans
      setLoans([]);
    })();
  }, [userId]);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text>My Loans</Text>
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 5 }}>
            <Text>Amount: {item.amount_musd} MUSD</Text>
            <Text>Status: {item.closed ? 'Closed' : 'Open'}</Text>
          </View>
        )}
      />
    </View>
  );
}
