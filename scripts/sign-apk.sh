#!/usr/bin/env bash
# Build + sign an installable release APK (arm64) with a local, gitignored keystore.
# First run creates signing/pocha-local.keystore and signing/key.properties (random password).
# Output: release/pocha-pop-<version>-arm64.apk     Usage: bash scripts/sign-apk.sh [--no-build]
set -euo pipefail
cd "$(dirname "$0")/.."
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}" NDK_HOME="${NDK_HOME:-/opt/android-sdk/ndk/27.0.12077973}"
export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-4}" GRADLE_OPTS="${GRADLE_OPTS:--Dorg.gradle.workers.max=4}"
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
VER=$(node -p "require('./package.json').version")
[[ "${1:-}" == "--no-build" ]] || npx tauri android build --apk --target aarch64
mkdir -p signing release
if [[ ! -f signing/key.properties ]]; then
  PW=$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20)
  printf 'storePassword=%s\nkeyAlias=pocha\nstoreFile=signing/pocha-local.keystore\n' "$PW" > signing/key.properties
  keytool -genkeypair -keystore signing/pocha-local.keystore -storepass "$PW" -keypass "$PW" -alias pocha \
    -keyalg RSA -keysize 2048 -validity 3650 -dname "CN=Pocha Pop local" >/dev/null
fi
PW=$(grep storePassword signing/key.properties | cut -d= -f2)
U=src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
"$BT/zipalign" -f -p 4 "$U" release/aligned.apk
"$BT/apksigner" sign --ks signing/pocha-local.keystore --ks-pass "pass:$PW" --ks-key-alias pocha \
  --out "release/pocha-pop-$VER-arm64.apk" release/aligned.apk
rm -f release/aligned.apk
"$BT/apksigner" verify "release/pocha-pop-$VER-arm64.apk" && echo "OK: release/pocha-pop-$VER-arm64.apk"
