import 'package:flutter/material.dart';
import 'package:heart_monitor/settings.dart';
import 'package:watch_it/watch_it.dart';

class AlarmsStatusWidget extends StatelessWidget with WatchItMixin {
  const AlarmsStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    // Watch the settings service for changes
    final settings = watchIt<SettingsService>();

    // Only show if alarms are disabled
    if (settings.alarmsEnabled) {
      return const SizedBox.shrink(); // Return empty widget
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: Colors.red.withOpacity(0.8), borderRadius: BorderRadius.circular(4)),
      child: const Text(
        'ALARMS OFF',
        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
      ),
    );
  }
}
