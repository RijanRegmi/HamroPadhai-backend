import admin from "firebase-admin";
import path from "path";

let initialized = false;

export function initFCM() {
  if (initialized) return;
  try {
    const serviceAccount = require(path.join(__dirname, "../config/firebase-service-account.json"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log("✅ Firebase Admin SDK initialized");
  } catch (err: any) {
    console.error("❌ Firebase Admin init failed:", err.message);
    console.error("   → Download service account from Firebase Console → Project Settings → Service Accounts");
    console.error("   → Save as: src/config/firebase-service-account.json");
  }
}

export async function sendFCMPush(
  fcmTokens: string[],
  title: string,
  body: string,
  type: string
): Promise<string[]> {
  const tokens = fcmTokens.filter(Boolean);
  if (tokens.length === 0) return [];

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      // ✅ data-only — NO notification field
      // FCM will NOT auto-show a system notification.
      // Flutter's onMessage / background handler shows exactly ONE local
      // notification, so there are no duplicates.
      data: { type, title, body },
      android: {
        priority: "high",
      },
      apns: {
        // contentAvailable wakes the app in background on iOS
        payload: { aps: { contentAvailable: true } },
      },
    });

    console.log(`📱 FCM: ${response.successCount} sent, ${response.failureCount} failed`);

    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        console.warn(`   ⚠️ Token ${i} failed: ${code}`);
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(tokens[i]);
        }
      }
    });

    return invalidTokens;
  } catch (err: any) {
    console.error("❌ FCM sendEachForMulticast error:", err.message);
    return [];
  }
}