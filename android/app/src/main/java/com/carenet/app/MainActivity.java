package com.carenet.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

/**
 * Edge-to-edge lets the WebView receive correct {@code env(safe-area-inset-*)} values
 * so headers and bottom nav clear the status bar and gesture inset (Pixel, etc.).
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
