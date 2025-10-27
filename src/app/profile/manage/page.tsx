import ProfileSettings from '../components/ProfileSettings';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Management - Sebenza AI',
  description: 'Manage all your profile settings, preferences, and account information in one place.'
};

export default function ProfileManagePage() {
  return <ProfileSettings />;
}
