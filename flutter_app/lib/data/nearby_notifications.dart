import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';

import '../models/post_office.dart';
import 'nearby_task_handler.dart';

typedef NearbyNotificationHandler = void Function(int officeId);

/// Port of src/lib/nearby-notifications.ts, built on the free
/// flutter_foreground_task + geolocator stack instead of the paid
/// flutter_background_geolocation SDK the web app's plugin uses (see
/// pubspec.yaml's comment — the user explicitly declined that $399+ one-time
/// cost on 24 Nov 2026).
///
/// Honest functional gap, not papered over: on Android this keeps a
/// persistent foreground-service notification and works reliably whenever
/// the app process is alive, backgrounded included — a real equivalent. On
/// iOS it can only run in short bursts (~30s every ~15min, via background
/// fetch) and does not survive the user force-quitting the app from the app
/// switcher; the paid SDK's iOS "significant location changes" mode has no
/// free equivalent. Revisit the license if closed-app iOS alerts turn out
/// to matter in practice.
class NearbyNotificationService {
  static NearbyNotificationHandler? _tapHandler;
  static bool _listening = false;

  /// Requests the permissions this needs and starts the watcher. Safe to
  /// call more than once.
  static Future<void> init({NearbyNotificationHandler? onOfficeTap}) async {
    if (onOfficeTap != null) _tapHandler = onOfficeTap;

    // This runs fire-and-forget from ExploreScreen.initState() (not awaited), so an
    // unhandled throw here becomes an uncaught async exception rather than something
    // a caller can catch — e.g. geolocator throws instead of returning `denied` when the
    // manifest is missing the location permissions it needs. This watcher is a best-effort
    // background feature; it must never be able to take the Explore/Offices screen down
    // with it, so every failure degrades to the same "quietly do nothing" the denied-
    // permission path already uses below.
    try {
      final notifPermission = await FlutterForegroundTask.checkNotificationPermission();
      if (notifPermission != NotificationPermission.granted) {
        await FlutterForegroundTask.requestNotificationPermission();
      }

      var locPermission = await Geolocator.checkPermission();
      if (locPermission == LocationPermission.denied) {
        locPermission = await Geolocator.requestPermission();
      }
      if (locPermission == LocationPermission.denied ||
          locPermission == LocationPermission.deniedForever) {
        return; // Same as the web app: quietly do nothing without permission.
      }

      if (!_listening) {
        FlutterForegroundTask.initCommunicationPort();
        FlutterForegroundTask.addTaskDataCallback(_onTaskData);
        _listening = true;
      }

      FlutterForegroundTask.init(
        androidNotificationOptions: AndroidNotificationOptions(
          channelId: 'nearby_watcher',
          channelName: 'Nearby stamp office watcher',
          channelDescription:
              'Keeps watching for nearby stamp post offices while Philatrail runs in the background.',
          onlyAlertOnce: true,
        ),
        iosNotificationOptions: const IOSNotificationOptions(showNotification: false, playSound: false),
        foregroundTaskOptions: ForegroundTaskOptions(
          // The position stream inside the task handler drives checks, not a timer.
          eventAction: ForegroundTaskEventAction.nothing(),
          autoRunOnBoot: false,
          allowWakeLock: true,
        ),
      );

      if (await FlutterForegroundTask.isRunningService) {
        await FlutterForegroundTask.restartService();
      } else {
        await FlutterForegroundTask.startService(
          serviceId: 821,
          notificationTitle: 'Looking for stamp stops…',
          notificationText: 'Philatrail is checking for nearby stamp post offices.',
          callback: nearbyNotificationsCallback,
        );
      }
    } catch (error, stack) {
      // Best-effort feature: log for diagnostics, never rethrow.
      debugPrint('NearbyNotificationService.init failed, continuing without it: $error\n$stack');
    }
  }

  static void _onTaskData(Object data) {
    if (data is Map && data['officeTap'] is int) {
      _tapHandler?.call(data['officeTap'] as int);
    }
  }

  /// Update the set of offices (and visited IDs) the watcher checks
  /// against. Safe to call any time. Serialized across the isolate
  /// boundary since the task handler runs in its own engine with no access
  /// to this one's in-memory state.
  static void setWatchedOffices(List<PostOffice> offices, Set<int> visitedIds) {
    FlutterForegroundTask.sendDataToTask(jsonEncode({
      'offices': offices
          .map((o) => {
                'id': o.id,
                'name': o.name,
                'pincode': o.pincode,
                'district': o.district,
                'state': o.state,
                'lat': o.lat,
                'lng': o.lng,
                'stampImagePath': o.stampImagePath,
                'aboutPlace': o.aboutPlace,
              })
          .toList(),
      'visitedIds': visitedIds.toList(),
    }));
  }

  static Future<void> stop() async {
    if (_listening) {
      FlutterForegroundTask.removeTaskDataCallback(_onTaskData);
      _listening = false;
    }
    await FlutterForegroundTask.stopService();
  }

  static bool get isSupported => Platform.isAndroid || Platform.isIOS;
}
