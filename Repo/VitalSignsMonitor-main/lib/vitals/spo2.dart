import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:get_it/get_it.dart';
import 'package:heart_monitor/settings.dart';

class SpO2Display extends StatefulWidget {
  final VoidCallback? onIncreaseSpO2Range;
  final VoidCallback? onDecreaseSpO2Range;
  final String? currentSpO2Range;

  const SpO2Display({super.key, this.onIncreaseSpO2Range, this.onDecreaseSpO2Range, this.currentSpO2Range});

  @override
  State<SpO2Display> createState() => _SpO2DisplayState();
}

class _SpO2DisplayState extends State<SpO2Display> {
  static const Color normalColor = Colors.cyanAccent;
  static const Color alarmColor = Colors.yellow;
  static const Color alarmTextColor = Colors.black;

  final SettingsService settings = GetIt.I<SettingsService>(); // Get settings service

  final Random _random = Random();
  late Timer _barTimer;
  late Timer _spo2Timer;
  Timer? _alarmFlashTimer;

  double _barHeightPercent = 0.6;
  int _spo2 = 98;
  double _pi = 3.0;
  int _pvi = 0;

  // Get SpO2 range from parent widget instead of managing internally
  int get _lowerSpO2 {
    if (widget.currentSpO2Range != null) {
      final parts = widget.currentSpO2Range!.split('-');
      return int.tryParse(parts[0]) ?? 95;
    }
    return 95;
  }

  int get _upperSpO2 {
    if (widget.currentSpO2Range != null) {
      final parts = widget.currentSpO2Range!.split('-');
      return int.tryParse(parts[1]) ?? 99;
    }
    return 99;
  }

  bool _isAlarming = false;
  bool _flashState = false;

  @override
  void initState() {
    super.initState();
    _startBarAnimation();
    _startSpo2Updates();
  }

  void _startBarAnimation() {
    _barTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (mounted) {
        setState(() {
          _barHeightPercent = 0.2 + _random.nextDouble() * 0.8;
        });
      }
    });
  }

  void _startSpo2Updates() {
    void scheduleNext() {
      final nextDelay = Duration(seconds: 3 + _random.nextInt(4)); // 3–6 sec
      _spo2Timer = Timer(nextDelay, () {
        if (mounted) {
          setState(() {
            _spo2 = _lowerSpO2 + _random.nextInt(_upperSpO2 - _lowerSpO2 + 1);
            _pi = (2.0 + _random.nextDouble() * 2.0); // 2.0–4.0
            _pvi = _random.nextInt(5); // 0–4
            _checkAlarmCondition();
          });
          scheduleNext();
        }
      });
    }

    scheduleNext();
  }

  void _checkAlarmCondition() {
    final bool shouldAlarm = _spo2 < 90;

    if (shouldAlarm && !_isAlarming) {
      // Start alarm
      _isAlarming = true;
      _startAlarmFlashing();
    } else if (!shouldAlarm && _isAlarming) {
      // Stop alarm
      _isAlarming = false;
      _stopAlarmFlashing();
    }
  }

  void _startAlarmFlashing() {
    // Flash at breathing rate (~15 breaths/min = 4 seconds per cycle = 2 sec per flash)
    _alarmFlashTimer = Timer.periodic(const Duration(milliseconds: 800), (_) {
      if (mounted && _isAlarming) {
        setState(() {
          _flashState = !_flashState;
        });

        // Play warning sound on each flash to yellow
        if (_flashState) {
          _playSpO2Warning();
        }
      }
    });
  }

  void _stopAlarmFlashing() {
    _alarmFlashTimer?.cancel();
    _alarmFlashTimer = null;
    if (mounted) {
      setState(() {
        _flashState = false;
      });
    }
  }

  void _playSpO2Warning() {
    if (settings.alarmsEnabled) {
      AudioPlayer().stop();
      AudioPlayer().play(AssetSource('sounds/spo2_warning.wav'));
    }
  }

  @override
  void dispose() {
    _barTimer.cancel();
    _spo2Timer.cancel();
    _alarmFlashTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Determine colors based on alarm state
    Color currentColor;
    Color textColor;
    Color borderColor;

    if (_isAlarming) {
      if (_flashState) {
        currentColor = alarmColor;
        textColor = alarmTextColor; // BLACK text on yellow background
        borderColor = alarmColor;
      } else {
        currentColor = alarmColor.withOpacity(0.3);
        textColor = alarmColor; // YELLOW text on transparent background
        borderColor = alarmColor.withOpacity(0.5);
      }
    } else {
      currentColor = normalColor;
      textColor = normalColor;
      borderColor = normalColor.withOpacity(0.6);
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Left vertical bar with label (NO alarm box around this)
        Column(
          children: [
            Text(
              'SpO₂',
              style: TextStyle(
                fontSize: 10,
                color: Colors.white70, // Always white70 for label
                fontWeight: FontWeight.w600,
                fontFamily: 'Nimbus',
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: 24,
              height: 100,
              decoration: BoxDecoration(
                border: Border.all(color: borderColor),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeInOut,
                  height: 100 * _barHeightPercent,
                  width: double.infinity,
                  color: currentColor.withOpacity(0.8),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 16),

        // Right-side display with alarm box
        Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: _isAlarming && _flashState
                  ? alarmColor // SOLID YELLOW background during flash
                  : Colors.transparent,
              border: _isAlarming ? Border.all(color: alarmColor, width: 2.0) : null,
              borderRadius: BorderRadius.circular(8.0),
            ),
            padding: _isAlarming ? const EdgeInsets.all(4.0) : EdgeInsets.zero,
            child: Center(
              // Wrap the whole thing in Center
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min, // Only take space needed
                children: [
                  Text(
                    'PI ${_pi.toStringAsFixed(1)}   PVI $_pvi',
                    style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Nimbus'),
                  ),
                  const SizedBox(height: 4), // Small space between elements
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _spo2.toString(),
                        style: TextStyle(
                          color: textColor,
                          fontSize: 70, // REDUCED from 86 to fit better
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Nimbus',
                        ),
                      ),
                      Text(
                        '%',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 18, // REDUCED from 20 to fit better
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Nimbus',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
