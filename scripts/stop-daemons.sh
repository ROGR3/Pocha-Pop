#!/usr/bin/env bash
# Stop the Gradle and Kotlin daemons a `tauri android build` leaves behind (several GB of RAM).
cd "$(dirname "$0")/../src-tauri/gen/android" && ./gradlew --stop >/dev/null 2>&1 || true
pkill -f '^[^ ]*java .*KotlinCompileDaemon' 2>/dev/null || true
echo "gradle/kotlin daemons stopped"
