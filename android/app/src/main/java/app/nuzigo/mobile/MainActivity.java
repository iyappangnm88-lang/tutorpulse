package app.nuzigo.mobile;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    private ActivityResultLauncher<String[]> webRtcPermissionLauncher;
    private PermissionRequest pendingWebRtcRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webRtcPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            (Map<String, Boolean> result) -> {
                if (pendingWebRtcRequest != null) {
                    try {
                        List<String> grantedResources = new ArrayList<>();
                        List<String> requestedList = Arrays.asList(pendingWebRtcRequest.getResources());

                        boolean cameraOk = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                        boolean audioOk = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

                        if (cameraOk && requestedList.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                            grantedResources.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
                        }
                        if (audioOk && requestedList.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            grantedResources.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE);
                        }

                        if (!grantedResources.isEmpty()) {
                            pendingWebRtcRequest.grant(grantedResources.toArray(new String[0]));
                        } else {
                            pendingWebRtcRequest.deny();
                        }
                    } catch (Exception e) {
                        try {
                            pendingWebRtcRequest.deny();
                        } catch (Exception ignored) {}
                    } finally {
                        pendingWebRtcRequest = null;
                    }
                }
            }
        );
    }

    @Override
    public void onStart() {
        super.onStart();
        applyCustomWebChromeClient();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyCustomWebChromeClient();
    }

    private void applyCustomWebChromeClient() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setWebChromeClient(new CustomWebChromeClient(bridge));
        }
    }

    private class CustomWebChromeClient extends BridgeWebChromeClient {

        public CustomWebChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            List<String> requestedList = Arrays.asList(request.getResources());
            boolean needsVideo = requestedList.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
            boolean needsAudio = requestedList.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE);

            if (!needsVideo && !needsAudio) {
                super.onPermissionRequest(request);
                return;
            }

            List<String> missingPermissions = new ArrayList<>();
            List<String> alreadyGrantedResources = new ArrayList<>();

            boolean cameraOk = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
            boolean audioOk = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

            if (needsVideo) {
                if (cameraOk) {
                    alreadyGrantedResources.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE);
                } else {
                    missingPermissions.add(Manifest.permission.CAMERA);
                }
            }

            if (needsAudio) {
                if (audioOk) {
                    alreadyGrantedResources.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE);
                } else {
                    missingPermissions.add(Manifest.permission.RECORD_AUDIO);
                    missingPermissions.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
                }
            }

            if (missingPermissions.isEmpty()) {
                if (!alreadyGrantedResources.isEmpty()) {
                    request.grant(alreadyGrantedResources.toArray(new String[0]));
                } else {
                    request.deny();
                }
            } else {
                pendingWebRtcRequest = request;
                webRtcPermissionLauncher.launch(missingPermissions.toArray(new String[0]));
            }
        }
    }
}
