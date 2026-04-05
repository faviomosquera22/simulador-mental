import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get_it/get_it.dart';
import 'package:heart_monitor/monitor.dart';
import 'package:heart_monitor/settings.dart';

final getIt = GetIt.instance;

void main() {
  setupServices();
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: []);
  runApp(const MainApp());
}

void setupServices() {
  getIt.registerSingleton<SettingsService>(SettingsService());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(body: Center(child: MonitorScreen())),
    );
  }
}
