#!/usr/bin/env python3
"""
WeatherView Mobile App Builder
Creates a standalone Android APK using a WebView wrapper.
Requires: Python 3.6+, requests (for downloading build tools)

Usage:
    pip install buildozer        # For Android builds
    python build_apk.py          # Interactive setup
    
    # Or use PWA directly (no build needed):
    # Simply open https://your-server.com in Chrome
    # Tap "Add to Home Screen"
"""

import os
import sys
import json
import shutil
import subprocess
import tempfile

APP_NAME = "WeatherView"
PACKAGE_NAME = "com.weatherview.app"
VERSION = "1.0.0"
SERVER_URL = "http://localhost:5000"


def check_dependencies():
    """Check if required build tools are available."""
    deps = {
        "python": sys.version,
        "git": shutil.which("git"),
    }
    
    # Check for Android build tools
    buildozer = shutil.which("buildozer")
    if buildozer:
        deps["buildozer"] = buildozer
    
    return deps


def generate_android_manifest():
    """Generate AndroidManifest.xml for the WebView app."""
    return """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{package_name}"
    android:versionCode="1"
    android:versionName="{version}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="{app_name}"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:label="{app_name}"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:screenOrientation="portrait"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
""".format(app_name=APP_NAME, package_name=PACKAGE_NAME, version=VERSION)


def generate_buildozer_spec():
    """Generate buildozer.spec for Android build."""
    return """[app]

# App title
title = {app_name}

# Package name
package.name = weatherview

# Package domain
package.domain = com

# Source directory
source.dir = .

# Source files
source.include_exts = py,png,jpg,kv,atlas

# Version
version = {version}

# Requirements
requirements = python3,kivy

# Android specifics
android.api = 31
android.minapi = 21
android.sdk = 34
android.ndk = 25
android.permissions = INTERNET,ACCESS_NETWORK_STATE
android.arch = arm64-v8a
android.allow_shared_libraries = True
android.accept_sdk_license = True
android.wakelock = True
android.orientation = portrait

# iOS specifics
ios.codesign.allowed = False

# App icon
icon.filename = %(source.dir)s/icon.png

# Presplash
presplash.filename = %(source.dir)s/presplash.png
""".format(app_name=APP_NAME, version=VERSION)


def generate_webview_app():
    """Generate a simple Kivy WebView app as an alternative."""
    return """
# WeatherView Mobile App (Kivy + WebView)
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.utils import platform
from kivy.animation import Animation

# Android WebView
if platform == 'android':
    from android.runnable import run_on_ui_thread
    from jnius import autoclass
    
    WebView = autoclass('android.webkit.WebView')
    WebViewClient = autoclass('android.webkit.WebViewClient')
    LayoutParams = autoclass('android.view.ViewGroup$LayoutParams')
    LinearLayout = autoclass('android.widget.LinearLayout')
    PythonActivity = autoclass('org.kivy.android.PythonActivity')


class WeatherViewApp(App):
    URL = "http://localhost:5000"
    
    def build(self):
        if platform == 'android':
            self.setup_android_webview()
        else:
            from kivy.uix.label import Label
            return Label(text=f"Open {self.URL} in your browser")
        return EmptyWidget()
    
    @run_on_ui_thread
    def setup_android_webview(self):
        activity = PythonActivity.mActivity
        layout = LinearLayout(activity)
        layout.setOrientation(1)  # vertical
        
        webview = WebView(activity)
        webview.getSettings().setJavaScriptEnabled(True)
        webview.getSettings().setDomStorageEnabled(True)
        webview.setWebViewClient(WebViewClient())
        webview.loadUrl(self.URL)
        
        layout.addView(webview, LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        ))
        
        activity.setContentView(layout)


class EmptyWidget(BoxLayout):
    pass


if __name__ == '__main__':
    WeatherViewApp().run()
"""


def create_pwa_setup_guide():
    """Create a simple setup guide for PWA installation."""
    return """# WeatherView Mobile App - Setup Guide

## Option 1: PWA (Progressive Web App) - RECOMMENDED
No build required! Works on all devices.

### Android:
1. Open Chrome and visit: http://localhost:5000
2. Tap the menu (⋮) → "Add to Home Screen"
3. Name it "WeatherView" and tap "Add"

### iOS:
1. Open Safari and visit: http://localhost:5000
2. Tap the Share button → "Add to Home Screen"
3. Name it "WeatherView" and tap "Add"

## Option 2: Android APK (using Buildozer)

### Requirements:
- Linux or WSL
- Python 3.x with buildozer
- Android SDK (automatically downloaded)

### Build Steps:
```bash
# Install buildozer
pip install buildozer

# Initialize build
cd mobile
buildozer init

# Build APK (takes a while first time)
buildozer android debug

# Find APK in:
# mobile/bin/WeatherView-1.0.0-*-debug.apk
```

## Option 3: Android APK (using WebView)

Generate a simple Android project using the included templates.
"""


def main():
    """Main entry point."""
    print("=" * 50)
    print("  WeatherView Mobile App Builder")
    print("=" * 50)
    print()
    
    deps = check_dependencies()
    print(f"  Python: {deps['python'].split()[0]}")
    print(f"  Git: {'Yes' if deps['git'] else 'No'}")
    print(f"  Buildozer: {'Yes' if deps.get('buildozer') else 'No (optional)'}")
    print()
    
    # Create mobile directory structure
    mobile_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"  Output directory: {mobile_dir}")
    print()
    print("  What would you like to do?")
    print()
    print("  1. Create PWA setup guide (recommended)")
    print("  2. Generate Android WebView source")
    print("  3. Generate Buildozer spec for APK build")
    print()
    
    # Create all setup files
    guide_path = os.path.join(mobile_dir, "SETUP_GUIDE.md")
    with open(guide_path, 'w') as f:
        f.write(create_pwa_setup_guide())
    print(f"  [✓] Created: {guide_path}")
    
    spec_path = os.path.join(mobile_dir, "buildozer.spec")
    if not os.path.exists(spec_path):
        with open(spec_path, 'w') as f:
            f.write(generate_buildozer_spec())
        print(f"  [✓] Created: {spec_path}")
    
    print()
    print("  Setup complete!")
    print()
    print("  For the easiest mobile experience:")
    print("  1. Start the server: python backend/app.py")
    print("  2. Open http://localhost:5000 on your phone")
    print("  3. Add to Home Screen via browser menu")
    print()
    print("  OR build an APK:")
    print("  cd mobile && buildozer android debug")


if __name__ == '__main__':
    main()
