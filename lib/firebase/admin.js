import admin from "firebase-admin";
import serviceAccount from "../../service_key.json" // Download this from Firebase Console

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;