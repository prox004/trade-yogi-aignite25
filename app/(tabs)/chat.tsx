import React from 'react';
import { View, StyleSheet } from 'react-native';
import AIChatbot from '../../components/AIChatbot';

export default function Chat() {
  return (
    <View style={styles.container}>
      <AIChatbot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 