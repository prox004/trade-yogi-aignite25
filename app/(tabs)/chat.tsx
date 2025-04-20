import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Chat() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://trade-yogi-chatbot.vercel.app' }}
        style={styles.webview}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
