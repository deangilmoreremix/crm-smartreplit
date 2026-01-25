export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Contacts: undefined;
  Deals: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  DealDetails: { dealId: string };
  ContactDetails: { contactId: string };
  CreateDeal: undefined;
  CreateContact: undefined;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
  ContactDetails: { contactId: string };
  CreateContact: undefined;
  EditContact: { contactId: string };
};

export type DealsStackParamList = {
  DealsList: undefined;
  DealDetails: { dealId: string };
  CreateDeal: undefined;
  EditDeal: { dealId: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ProfileSettings: undefined;
  NotificationSettings: undefined;
  PrivacySettings: undefined;
  WhitelabelSettings: undefined;
};