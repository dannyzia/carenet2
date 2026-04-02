package com.carenet.app;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

/**
 * Creates Android O+ notification channels for FCM (D021).
 * Channel IDs must match payloads sent from the backend / Edge Functions.
 */
public class CareNetApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) {
            return;
        }

        nm.createNotificationChannel(channel(
            "care_safety",
            "Care & Safety Alerts",
            NotificationManager.IMPORTANCE_HIGH,
            "Incidents, emergencies, vitals anomalies"
        ));
        nm.createNotificationChannel(channel(
            "shift_reminders",
            "Shift Reminders",
            NotificationManager.IMPORTANCE_HIGH,
            "Upcoming shifts and check-in reminders"
        ));
        nm.createNotificationChannel(channel(
            "messages",
            "Messages",
            NotificationManager.IMPORTANCE_DEFAULT,
            "New conversation messages"
        ));
        nm.createNotificationChannel(channel(
            "placement_updates",
            "Placement Updates",
            NotificationManager.IMPORTANCE_DEFAULT,
            "Placement and assignment changes"
        ));
        nm.createNotificationChannel(channel(
            "payment_billing",
            "Payments & Billing",
            NotificationManager.IMPORTANCE_DEFAULT,
            "Payments, invoices, payouts"
        ));
        nm.createNotificationChannel(channel(
            "platform_updates",
            "Platform Updates",
            NotificationManager.IMPORTANCE_LOW,
            "Account and verification updates"
        ));
        nm.createNotificationChannel(channel(
            "marketing",
            "News & Updates",
            NotificationManager.IMPORTANCE_MIN,
            "Optional announcements"
        ));
    }

    private static NotificationChannel channel(
            String id,
            String name,
            int importance,
            String description
    ) {
        NotificationChannel ch = new NotificationChannel(id, name, importance);
        ch.setDescription(description);
        return ch;
    }
}
