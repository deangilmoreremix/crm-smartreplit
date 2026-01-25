import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import { useChatbot } from '../contexts/ChatbotContext';
import { Icon } from '../components/Icon';

const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { config } = useWhitelabel();
  const { showChatbot } = useChatbot();

  const quickActions = config.screens.dashboard.showQuickActions
    ? config.screens.dashboard.quickActions
    : [];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Welcome Message */}
      {config.screens.dashboard.showWelcomeMessage && (
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
            {config.screens.dashboard.welcomeMessage}
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
            Here's what's happening with your business today.
          </Text>
        </View>
      )}

      {/* AI Assistant Section */}
      <View style={styles.aiAssistantSection}>
        <TouchableOpacity
          style={[styles.aiAssistantCard, { backgroundColor: theme.colors.surface }]}
          onPress={showChatbot}
        >
          <View style={styles.aiAssistantContent}>
            <View style={styles.aiAssistantLeft}>
              <View
                style={[styles.aiIconContainer, { backgroundColor: config.branding.primaryColor }]}
              >
                <Icon name="bot" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.aiAssistantText}>
                <Text style={[styles.aiAssistantTitle, { color: theme.colors.text }]}>
                  Need Help?
                </Text>
                <Text style={[styles.aiAssistantSubtitle, { color: theme.colors.textSecondary }]}>
                  Ask our AI assistant about contacts, deals, dashboard, and features
                </Text>
              </View>
            </View>
            <View style={[styles.aiAssistantArrow, { borderLeftColor: theme.colors.border }]}>
              <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickActionButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon name={action.icon} size={24} color={config.branding.primaryColor} />
                <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="users" size={24} color={config.branding.primaryColor} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Contacts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="dollar-sign" size={24} color={config.branding.accentColor} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>$0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Revenue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="activity" size={24} color={config.branding.secondaryColor} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Deals</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="trending-up" size={24} color="#10B981" />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>0%</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Growth</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
  },
  // AI Assistant Section Styles
  aiAssistantSection: {
    marginBottom: 24,
  },
  aiAssistantCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiAssistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiAssistantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiAssistantText: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  aiAssistantSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  aiAssistantArrow: {
    borderLeftWidth: 1,
    paddingLeft: 12,
    marginLeft: 12,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default DashboardScreen;
