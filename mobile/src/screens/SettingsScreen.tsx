import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

const SettingsScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

      <View style={styles.settingsList}>
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
          onPress={toggleTheme}
        >
          <View style={styles.settingLeft}>
            <Icon name={theme.isDark ? 'sun' : 'moon'} size={20} color={theme.colors.text} />
            <Text style={[styles.settingText, { color: theme.colors.text }]}>
              {theme.isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
          onPress={handleSignOut}
        >
          <View style={styles.settingLeft}>
            <Icon name="log-out" size={20} color={theme.colors.error} />
            <Text style={[styles.settingText, { color: theme.colors.error }]}>
              Sign Out
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  settingsList: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
});

export default SettingsScreen;