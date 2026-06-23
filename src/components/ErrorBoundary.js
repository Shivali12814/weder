import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.log('App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.emoji}>⚠️</Text>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.msg}>{this.state.error?.message || 'Unknown error'}</Text>
          <TouchableOpacity style={s.btn} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={s.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0518', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji:     { fontSize: 48, marginBottom: 16 },
  title:     { fontSize: 20, fontWeight: '700', color: '#FDF6EC', marginBottom: 8 },
  msg:       { fontSize: 13, color: 'rgba(253,246,236,0.5)', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  btn:       { backgroundColor: '#C9A84C', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999 },
  btnText:   { color: '#0A0518', fontWeight: '700', fontSize: 15 },
});
