plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "app.vinvi.philatrail"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        // Required by the flutter_local_notifications plugin (CheckAarMetadata
        // fails the build otherwise: "requires core library desugaring to be
        // enabled for :app") — see developer.android.com/studio/write/java8-support.
        isCoreLibraryDesugaringEnabled = true
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "app.vinvi.philatrail"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        // Mirrors the existing Capacitor app's CI signing contract exactly —
        // see /.github/workflows/android-release.yml and docs/RELEASE.md.
        // Same four GitHub Actions secrets, same env var names
        // (KEYSTORE_FILE/KEYSTORE_PASSWORD/KEY_ALIAS/KEY_PASSWORD), so the
        // keystore itself never needs to leave GitHub secrets. When these
        // env vars aren't set (a local `flutter run --release`), this falls
        // back to the debug key so local builds still work.
        create("release") {
            val keystoreFile = System.getenv("KEYSTORE_FILE")
            if (keystoreFile != null) {
                storeFile = file(keystoreFile)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
        // Gradle's own default debug signingConfig auto-generates a RANDOM
        // per-machine key at ~/.android/debug.keystore — fine normally, but
        // it means every machine (your laptop, this CI runner, anyone
        // else's machine) signs debug builds with a DIFFERENT SHA-1, which
        // breaks Google Sign-In: the Android OAuth client registered in
        // Google Cloud Console is keyed to one fixed SHA-1. Pointing
        // "debug" at this checked-in keystore instead (debug.keystore,
        // alias androiddebugkey, both passwords "android" — the same
        // non-secret defaults Android tooling has always used for debug
        // builds) makes every debug build's SHA-1 identical everywhere.
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            // R8 strips classes that flutter_local_notifications / flutter_foreground_task
            // load by reflection, which crashes release builds only. Size cost is small.
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig =
                if (System.getenv("KEYSTORE_FILE") != null) {
                    signingConfigs.getByName("release")
                } else {
                    // Local `flutter run --release` with no CI secrets present.
                    signingConfigs.getByName("debug")
                }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    // Pairs with isCoreLibraryDesugaringEnabled above.
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
