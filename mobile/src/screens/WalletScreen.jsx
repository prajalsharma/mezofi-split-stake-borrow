import React from 'react';
import { View, Text } from 'react-native';

export default function WalletScreen({ route }) {
  const { userId } = route.params;
  const [balance, setBalance] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      // TODO: fetch current fiat and MUSD balances, active loans etc.
      setBalance(0);
    })();
  }, [userId]);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Wallet Balance</Text>
      <Text>INR: {balance}</Text>
      {/* Additional loan and collateral info */}
    </View>
  );
}
