

import { LandingPage } from "@/components/landing-page"
import FCMTokenUpdater from '@/components/firebase/fcm-token-updater';

import { authOptions } from "@/auth";

export default async function Home() {
  // const session = await getServerSession(authOptions);

  return (
    <>
     {/* {session && <FCMTokenUpdater />} */}
      <LandingPage />
    </>
  );
}
