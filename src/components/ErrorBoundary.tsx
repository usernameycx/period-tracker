import React, { Component, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('ErrorBoundary caught:', error.message, info.componentStack?.slice(0, 200));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Icon name="warning" size={48} color={Colors.warning} />
            <Text style={styles.title}>出错了</Text>
            <Text style={styles.message}>
              {this.state.error?.message || '应用遇到了意外错误'}
            </Text>
            <PressableScale style={styles.btn} onPress={this.handleRetry}>
              <Text style={styles.btnText}>重试</Text>
            </PressableScale>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadow.card,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  btnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
