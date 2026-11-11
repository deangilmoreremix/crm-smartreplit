import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, ExternalLink, User, Building2, Clock, Tag } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useContactStore } from '../../store/contactStore';
import { useDemoDataSafe } from '../../contexts/DemoDataContext';
import SampleBadge from '../SampleBadge';
import { getInitials } from '../../utils/avatars';
import type { Contact } from '../../types/contact';

/** Static sample profile, shown only while sample data is on and there is no real contact. */
const SAMPLE_PROFILE: Contact = {
  id: 'sample-profile',
  isDemo: true,
  firstName: 'Eva',
  lastName: 'Robinson',
  name: 'Eva Robinson',
  email: 'eva@example.com',
  phone: '+1 (555) 010-0123',
  company: 'Alabama Machinery & Supply',
  title: 'CEO',
  status: 'customer',
  avatarSrc:
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  lastConnected: '06/15/2023 at 7:16 pm',
} as Contact;

const recency = (c: Contact): number => {
  const t = (v: unknown) => (v ? new Date(v as any).getTime() || 0 : 0);
  return Math.max(t(c.lastContact), t(c.updatedAt), t(c.createdAt));
};

/** Most recent real (non-sample) contact, or null. */
export function pickRealContact(contacts: Record<string, Contact>): Contact | null {
  const real = Object.values(contacts ?? {}).filter((c) => c && !c.isDemo);
  if (!real.length) return null;
  return real.sort((a, b) => recency(b) - recency(a) || a.id.localeCompare(b.id))[0];
}

const CustomerProfile: React.FC = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { showDemoData } = useDemoDataSafe();
  const contacts = useContactStore((s) => s.contacts);

  const real = pickRealContact(contacts);
  const contact = real ?? (showDemoData ? SAMPLE_PROFILE : null);
  const isSample = !real && !!contact;

  const muted = isDark ? 'text-gray-400' : 'text-gray-600';
  const strong = isDark ? 'text-white' : 'text-gray-900';
  const actionCls = `p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`;

  const shell = (children: React.ReactNode) => (
    <div className={`${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl rounded-2xl p-6 mb-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${strong}`}>
          Customer Profile
          {isSample && <SampleBadge className="ml-2 align-middle" />}
        </h3>
      </div>
      {children}
    </div>
  );

  if (!contact) {
    return shell(
      <p className={`text-sm ${muted}`} data-testid="customer-profile-empty">
        No customer selected. Add a contact to see their profile here.
      </p>
    );
  }

  const rows: { icon: React.ElementType; label: string; value?: string }[] = [
    { icon: User, label: 'First Name', value: contact.firstName },
    { icon: User, label: 'Last Name', value: contact.lastName },
    { icon: Mail, label: 'Email', value: contact.email },
    { icon: Phone, label: 'Phone Number', value: contact.phone },
    { icon: Building2, label: 'Company', value: contact.company },
    { icon: Tag, label: 'Status', value: contact.status },
    { icon: Clock, label: 'Last Connected', value: contact.lastConnected },
  ].filter((r) => r.value);

  const subtitle = [contact.title || contact.position, contact.company].filter(Boolean).join(', ');
  const avatar = contact.avatarSrc || contact.avatar;

  return shell(
    <>
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mx-auto mb-4">
          {avatar ? (
            <img src={avatar} alt={contact.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-xl font-semibold">
              {getInitials(contact.name)}
            </div>
          )}
        </div>
        <h4 className={`text-xl font-semibold ${strong} mb-1`} data-testid="customer-profile-name">
          {contact.name}
        </h4>
        {subtitle && <p className={`text-sm ${muted}`}>{subtitle}</p>}
      </div>

      {!isSample && (
        <div className="flex justify-center space-x-3 mb-8">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className={actionCls}
              title="Email"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={actionCls} title="Call" aria-label="Call">
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            className={actionCls}
            title="View contact"
            aria-label="View contact"
            onClick={() => navigate(`/contacts/${contact.id}`)}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center space-x-3 py-2">
            <div
              className={`w-8 h-8 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'} rounded-full flex items-center justify-center`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-sm font-medium ${strong}`}>{label}</p>
              <p className={`text-sm ${muted}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default CustomerProfile;
