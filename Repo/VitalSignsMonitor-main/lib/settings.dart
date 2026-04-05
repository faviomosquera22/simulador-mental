import 'package:flutter/foundation.dart';

class SettingsService extends ChangeNotifier {
  bool _alarmsEnabled = true;
  bool _playBeats = true;
  
  bool get alarmsEnabled => _alarmsEnabled;
  bool get playBeats => _playBeats;
  
  // Setters that notify listeners
  set alarmsEnabled(bool value) {
    if (_alarmsEnabled != value) {
      _alarmsEnabled = value;
      notifyListeners();
    }
  }
  
  set playBeats(bool value) {
    if (_playBeats != value) {
      _playBeats = value;
      notifyListeners();
    }
  }
  
  void toggleAlarms() {
    alarmsEnabled = !alarmsEnabled;
  }
  
  void toggleBeats() {
    playBeats = !playBeats;
  }
}