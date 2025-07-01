import { AdminDashboard } from "@/components/admin/admin-dashboard"
import FCMTokenUpdater from '@/components/firebase/fcm-token-updater';

export default function AdminPage() {
  return (
    <>
      <FCMTokenUpdater />
      <AdminDashboard />
    </>
  );
}
