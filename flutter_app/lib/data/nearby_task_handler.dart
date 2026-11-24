import 'dart:async';
import 'dart:convert';

import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';

import '../core/geofence.dart';
import '../models/post_office.dart';

/// Runs in flutter_foreground_task's own isolate (a separate Flutter engine,
/// not the main app's), started via nearby_notifications.dart. The
/// top-level entry point is required by the plugin's own contract — see its
/// README, "callback function should always be a top-level or static
/// function".
@pragma('vm:entry-point')
void nearbyNotificationsCallback() {
  FlutterForegroundTask.setTaskHandler(_NearbyTaskHandler());
}

const String _channelId = 'nearby';

class _NearbyTaskHandler extends TaskHandler {
  final _notifyTracker = GeofenceNotifyTracker();
  final _notifications = FlutterLocalNotificationsPlugin();
  List<PostOffice> _offices = [];
  Set<int> _visitedIds = {};
  StreamSubscription<Position>? _positionSub;

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    await _notifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
      onDidReceiveNotificationResponse: (response) {
        final officeId = int.tryParse(response.payload ?? '');
        if (officeId != null) {
          // Forwarded to the main isolate's UI — see nearby_notifications.dart.
          FlutterForegroundTask.sendDataToMain(<String, int>{'officeTap': officeId});
        }
      },
    );
    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(const AndroidNotificationChannel(
          _channelId,
          'Nearby post offices',
          description: 'Alerts when you are near a stamp post office',
          importance: Importance.high,
        ));

    // distanceFilter 50m matches the web app's background-geolocation config
    // (nearby-notifications.ts) — only wake up for meaningful movement.
    _positionSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, distanceFilter: 50),
    ).listen(_onPosition);
  }

  Future<void> _onPosition(Position position) async {
    if (_offices.isEmpty) return;
    final nearby = await _notifyTracker.findNearbyOffice(
      position.latitude,
      position.longitude,
      _offices,
      _visitedIds,
    );
    if (nearby == null) return;

    // Mark notified BEFORE scheduling, same reasoning as nearby-notifications.ts:
    // a rapid second position update shouldn't fire a duplicate before the
    // first notification is even shown.
    await _notifyTracker.markNotified(nearby.id);

    final notifId = (nearby.id % 2147483647) == 0 ? 1 : nearby.id % 2147483647;
    await _notifications.show(
      notifId,
      'Stamp stop nearby \u{1F4EE}',
      '${nearby.name} is within ${geofenceRadiusM}m — tap to view.',
      const NotificationDetails(
        android: AndroidNotificationDetails(_channelId, 'Nearby post offices', importance: Importance.high),
      ),
      payload: '${nearby.id}',
    );
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    // Not used — the position stream (not a timer) drives nearby checks.
  }

  @override
  void onReceiveData(Object data) {
    if (data is! String) return;
    final decoded = jsonDecode(data) as Map<String, dynamic>;
    _offices = (decoded['offices'] as List)
        .map((e) => PostOffice.fromJson(e as Map<String, dynamic>))
        .toList();
    _visitedIds = (decoded['visitedIds'] as List).map((e) => e as int).toSet();
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {
    await _positionSub?.cancel();
  }
}
