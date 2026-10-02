package app.nuzigo.mobile;

import android.Manifest;
import android.app.AppOpsManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "FocusAndroid",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class FocusAndroidPlugin extends Plugin {

    public static final String FOCUS_NOTIFICATION_CHANNEL_ID = "nuzigo_focus_channel";

    @Override
    public void load() {
        super.load();
        createFocusNotificationChannel();
    }

    private void createFocusNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Focus Session";
            String description = "Notifications for active study sessions and break reminders";
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel channel = new NotificationChannel(FOCUS_NOTIFICATION_CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.setShowBadge(true);

            NotificationManager notificationManager = getContext().getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * Checks whether Android Display over other apps (Overlay) permission is granted.
     */
    @PluginMethod
    public void isOverlayPermissionGranted(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            granted = Settings.canDrawOverlays(getContext());
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.M);
        call.resolve(ret);
    }

    /**
     * Opens Android settings for Display over other apps (Overlay) permission.
     */
    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(getContext())) {
                try {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getContext().getPackageName())
                    );
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);
                    JSObject ret = new JSObject();
                    ret.put("opened", true);
                    ret.put("alreadyGranted", false);
                    call.resolve(ret);
                    return;
                } catch (Exception e) {
                    // Fallback to generic settings if package uri fails on certain OEM ROMs
                    try {
                        Intent fallbackIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                        fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        getContext().startActivity(fallbackIntent);
                        JSObject ret = new JSObject();
                        ret.put("opened", true);
                        ret.put("alreadyGranted", false);
                        call.resolve(ret);
                        return;
                    } catch (Exception ex) {
                        call.reject("Failed to open overlay settings: " + ex.getMessage());
                        return;
                    }
                }
            } else {
                JSObject ret = new JSObject();
                ret.put("opened", false);
                ret.put("alreadyGranted", true);
                call.resolve(ret);
                return;
            }
        }

        JSObject ret = new JSObject();
        ret.put("opened", false);
        ret.put("alreadyGranted", true);
        call.resolve(ret);
    }

    /**
     * Checks whether Android Usage Access permission (AppOps OPSTR_GET_USAGE_STATS) is granted.
     */
    @PluginMethod
    public void isUsageAccessGranted(PluginCall call) {
        boolean granted = false;
        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP;

        if (supported) {
            try {
                AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
                if (appOps != null) {
                    int mode = appOps.checkOpNoThrow(
                        AppOpsManager.OPSTR_GET_USAGE_STATS,
                        android.os.Process.myUid(),
                        getContext().getPackageName()
                    );
                    granted = (mode == AppOpsManager.MODE_ALLOWED);
                }
            } catch (Exception e) {
                granted = false;
            }
        }

        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("supported", supported);
        call.resolve(ret);
    }

    /**
     * Opens Android settings for Usage Access.
     */
    @PluginMethod
    public void requestUsageAccess(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
                return;
            } catch (Exception e) {
                call.reject("Failed to open usage access settings: " + e.getMessage());
                return;
            }
        }

        JSObject ret = new JSObject();
        ret.put("opened", false);
        call.resolve(ret);
    }

    /**
     * Checks whether Notification permission is granted.
     */
    @PluginMethod
    public void isNotificationPermissionGranted(PluginCall call) {
        boolean granted = true;
        boolean supported = true;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            granted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED;
        } else {
            granted = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        }

        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("supported", supported);
        call.resolve(ret);
    }

    /**
     * Requests Notification runtime permission (Android 13+) or returns current state.
     */
    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != PermissionState.GRANTED) {
                requestPermissionForAlias("notifications", call, "notificationsCallback");
                return;
            }
        }

        boolean granted = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PermissionCallback
    private void notificationsCallback(PluginCall call) {
        boolean granted = getPermissionState("notifications") == PermissionState.GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    /**
     * Returns a summary of native Focus capabilities on this Android device.
     */
    @PluginMethod
    public void getCapabilities(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isAndroid", true);
        ret.put("apiLevel", Build.VERSION.SDK_INT);
        ret.put("canOverlay", Build.VERSION.SDK_INT >= Build.VERSION_CODES.M);
        ret.put("canUsageStats", Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
        ret.put("needsRuntimeNotificationPermission", Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU);
        call.resolve(ret);
    }
}
