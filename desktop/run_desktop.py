#!/usr/bin/env python3
"""
WeatherView Desktop - Run & Build Script

Usage:
    python run_desktop.py          # Run the app
    python run_desktop.py build    # Build executable with PyInstaller
"""

import sys
import os
import subprocess


def run_app():
    """Run the desktop weather app."""
    from weather_app import main
    main()


def build_exe():
    """Build standalone executable with PyInstaller."""
    print("📦 Building WeatherView Desktop executable...")
    print()

    # Ensure we're in the desktop directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Build command
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--name', 'WeatherView',
        '--windowed',
        '--onefile',
        '--add-data', f'../frontend{os.pathsep}frontend',
        '--add-data', f'../backend{os.pathsep}backend',
        '--icon', 'NONE',
        '--clean',
        '--noconfirm',
        os.path.join(script_dir, 'weather_app.py'),
    ]

    try:
        subprocess.run(cmd, cwd=script_dir, check=True)
        print()
        print("✅ Build complete!")
        print(f"📁 Executable located at: {os.path.join(script_dir, 'dist', 'WeatherView.exe')}")
        print()
        print("📋 The executable is portable and requires no installation.")
        print("   Share it with anyone - it's completely free!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        print()
        print("💡 Make sure PyInstaller is installed:")
        print("   pip install pyinstaller")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ PyInstaller not found. Install it with:")
        print("   pip install pyinstaller")
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'build':
        build_exe()
    else:
        run_app()
