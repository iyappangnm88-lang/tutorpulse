package app.nuzigo.mobile;

import android.Manifest;
import android.app.AppOpsManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;

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

    private final Set<String> blockedPackages = Collections.synchronizedSet(new HashSet<String>());
    private volatile boolean isBlockingActive = false;
    private Handler blockingHandler;
    private Runnable blockingRunnable;

    @Override
    public void load() {
        super.load();
        createFocusNotificationChannel();
    }

    @Override
    protected void handleOnDestroy() {
        isBlockingActive = false;
        if (blockingHandler != null && blockingRunnable != null) {
            blockingHandler.removeCallbacks(blockingRunnable);
        }
        super.handleOnDestroy();
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

    /**
     * Converts an Android Drawable into a Base64 encoded PNG data URL.
     */
    private String drawableToBase64(Drawable drawable) {
        if (drawable == null) return null;
        try {
            int width = drawable.getIntrinsicWidth();
            int height = drawable.getIntrinsicHeight();
            if (width <= 0 || height <= 0) {
                width = 96;
                height = 96;
            } else {
                int maxSize = 96;
                if (width > maxSize || height > maxSize) {
                    float ratio = (float) width / (float) height;
                    if (ratio > 1) {
                        width = maxSize;
                        height = Math.max(1, (int) (maxSize / ratio));
                    } else {
                        height = maxSize;
                        width = Math.max(1, (int) (maxSize * ratio));
                    }
                }
            }

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
            drawable.draw(canvas);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);
            byte[] byteArray = outputStream.toByteArray();
            outputStream.close();
            bitmap.recycle();

            return "data:image/png;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Retrieves launchable non-system & user apps installed on this Android device with their native app icons.
     */
    @PluginMethod
    public void getInstalledApps(final PluginCall call) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    PackageManager pm = getContext().getPackageManager();
                    Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
                    mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
                    List<ResolveInfo> pkgAppsList = pm.queryIntentActivities(mainIntent, 0);

                    JSArray appsArray = new JSArray();
                    String myPackage = getContext().getPackageName();
                    Set<String> seen = new HashSet<String>();

                    for (ResolveInfo info : pkgAppsList) {
                        if (info.activityInfo == null || info.activityInfo.packageName == null) continue;
                        String pkg = info.activityInfo.packageName;
                        if (pkg.equals(myPackage) || seen.contains(pkg)) continue;
                        seen.add(pkg);

                        String label = "";
                        try {
                            CharSequence cs = info.loadLabel(pm);
                            if (cs != null) label = cs.toString();
                        } catch (Exception e) {
                            label = pkg;
                        }
                        if (label.isEmpty()) label = pkg;

                        boolean isSystem = (info.activityInfo.applicationInfo != null) &&
                            ((info.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0);

                        String iconDataUrl = null;
                        try {
                            Drawable iconDrawable = info.loadIcon(pm);
                            if (iconDrawable == null && info.activityInfo.applicationInfo != null) {
                                iconDrawable = info.activityInfo.applicationInfo.loadIcon(pm);
                            }
                            iconDataUrl = drawableToBase64(iconDrawable);
                        } catch (Exception ignored) {}

                        JSObject appObj = new JSObject();
                        appObj.put("packageName", pkg);
                        appObj.put("appName", label);
                        appObj.put("isSystem", isSystem);
                        if (iconDataUrl != null) {
                            appObj.put("iconDataUrl", iconDataUrl);
                        }
                        appsArray.put(appObj);
                    }

                    JSObject ret = new JSObject();
                    ret.put("apps", appsArray);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Failed to get installed apps: " + e.getMessage());
                }
            }
        }).start();
    }

    /**
     * Starts monitoring and blocking selected packages during an active Focus session.
     */
    @PluginMethod
    public void startAppBlocking(PluginCall call) {
        JSArray packages = call.getArray("packages");
        blockedPackages.clear();
        if (packages != null) {
            for (int i = 0; i < packages.length(); i++) {
                try {
                    String pkg = packages.getString(i);
                    if (pkg != null && !pkg.trim().isEmpty() && !pkg.equals(getContext().getPackageName())) {
                        blockedPackages.add(pkg.trim());
                    }
                } catch (Exception ignored) {}
            }
        }

        isBlockingActive = true;

        if (blockingHandler == null) {
            blockingHandler = new Handler(Looper.getMainLooper());
        }
        if (blockingRunnable != null) {
            blockingHandler.removeCallbacks(blockingRunnable);
        }

        blockingRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isBlockingActive) return;
                try {
                    checkForegroundAndEnforce();
                } catch (Exception ignored) {}
                if (isBlockingActive) {
                    blockingHandler.postDelayed(this, 750);
                }
            }
        };

        blockingHandler.post(blockingRunnable);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("count", blockedPackages.size());
        call.resolve(ret);
    }

    /**
     * Stops active app blocking.
     */
    @PluginMethod
    public void stopAppBlocking(PluginCall call) {
        isBlockingActive = false;
        blockedPackages.clear();
        if (blockingHandler != null && blockingRunnable != null) {
            blockingHandler.removeCallbacks(blockingRunnable);
        }
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    /**
     * Returns whether app blocking is currently running.
     */
    @PluginMethod
    public void isAppBlockingActive(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("active", isBlockingActive);
        ret.put("count", blockedPackages.size());
        call.resolve(ret);
    }

    private void checkForegroundAndEnforce() {
        if (!isBlockingActive || blockedPackages.isEmpty()) return;
        String currentForegroundPkg = getForegroundPackage();
        if (currentForegroundPkg != null && blockedPackages.contains(currentForegroundPkg)) {
            // Distracting app detected in foreground during active focus session!
            // 1. Bring NUZIGO back to foreground
            try {
                Intent intent = new Intent(getContext(), MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                getContext().startActivity(intent);
            } catch (Exception ignored) {}

            // 2. Notify JS listeners
            JSObject event = new JSObject();
            event.put("blockedPackage", currentForegroundPkg);
            event.put("timestamp", System.currentTimeMillis());
            notifyListeners("appBlocked", event);
        }
    }

    private String getForegroundPackage() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
                if (usm == null) return null;
                long time = System.currentTimeMillis();
                UsageEvents events = usm.queryEvents(time - 10000, time);
                UsageEvents.Event event = new UsageEvents.Event();
                String lastForeground = null;
                while (events != null && events.hasNextEvent()) {
                    events.getNextEvent(event);
                    if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED ||
                        event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                        lastForeground = event.getPackageName();
                    }
                }
                if (lastForeground != null) {
                    return lastForeground;
                }
                List<UsageStats> appList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 10000, time);
                if (appList != null && !appList.isEmpty()) {
                    SortedMap<Long, UsageStats> mySortedMap = new TreeMap<Long, UsageStats>();
                    for (UsageStats usageStats : appList) {
                        mySortedMap.put(usageStats.getLastTimeUsed(), usageStats);
                    }
                    if (!mySortedMap.isEmpty()) {
                        return mySortedMap.get(mySortedMap.lastKey()).getPackageName();
                    }
                }
            } catch (Exception ignored) {}
        }
        return null;
    }
}

