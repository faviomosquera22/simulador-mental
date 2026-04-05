import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:heart_monitor/widgets/button_bar.dart';
import 'package:heart_monitor/waveforms/co2_waveform.dart';
import 'package:heart_monitor/widgets/top_status_bar.dart';
import 'package:heart_monitor/waveforms/respiratory.dart';
import 'waveforms/waveforms.dart';
import 'vitals/vitals_panel.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class MonitorScreen extends StatefulWidget {
  const MonitorScreen({super.key});

  @override
  State<MonitorScreen> createState() => _MonitorScreenState();
}

class _MonitorScreenState extends State<MonitorScreen> {
  late int _bpm;
  int _lowerBpm = 70;
  int _upperBpm = 80;

  // SpO2 range management
  int _lowerSpO2 = 95;
  int _upperSpO2 = 99;

  late Timer _timer;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable(); // Keep the screen awake
    // Initialize with a baseline heart rate
    _bpm = _lowerBpm + _random.nextInt(_upperBpm - _lowerBpm + 1);
    // Start a timer to update the heart rate every few seconds
    _timer = Timer.periodic(Duration(seconds: 2 + _random.nextInt(3)), (timer) {
      _updateBpm();
    });
  }

  void _updateBpm() {
    // Generate a new random BPM within the defined range
    if (!mounted) return;
    setState(() {
      _bpm = _lowerBpm + _random.nextInt(_upperBpm - _lowerBpm + 1);
    });
  }

  void _adjustBpmRange(int amount) {
    setState(() {
      _lowerBpm += amount;
      _upperBpm += amount;

      // Add some safety checks to keep the BPM in a reasonable range
      if (_lowerBpm < 30) {
        _lowerBpm = 30;
        _upperBpm = _lowerBpm + 10;
      }
      if (_upperBpm > 220) {
        _upperBpm = 220;
        _lowerBpm = _upperBpm - 10;
      }
    });
    // Update the BPM immediately after adjustment
    _updateBpm();
  }

  // New methods for more granular BPM control
  void _increaseBpmRange() => _adjustBpmRange(5);
  void _decreaseBpmRange() => _adjustBpmRange(-5);
  void _increaseBpmRangeFast() => _adjustBpmRange(10);
  void _decreaseBpmRangeFast() => _adjustBpmRange(-10);

  // SpO2 range control methods
  void _adjustSpO2Range(int amount) {
    setState(() {
      _lowerSpO2 += amount;
      _upperSpO2 += amount;

      // Add safety checks to keep SpO2 in reasonable range
      if (_lowerSpO2 < 70) {
        _lowerSpO2 = 70;
        _upperSpO2 = _lowerSpO2 + 4;
      }
      if (_upperSpO2 > 100) {
        _upperSpO2 = 100;
        _lowerSpO2 = _upperSpO2 - 4;
      }
    });
  }

  void _increaseSpO2Range() => _adjustSpO2Range(2);
  void _decreaseSpO2Range() => _adjustSpO2Range(-2);

  // If you want to disable wakelock when done monitoring:
  @override
  void dispose() {
    WakelockPlus.disable(); // Allow the screen to sleep again
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Column(
        children: [
          const TopStatusBar(), // 🟩 new bar at the top

          Expanded(
            child: Row(
              children: [
                // Left side: Waveforms
                Expanded(
                  flex: 3,
                  child: Column(
                    children: [
                      Expanded(
                        child: WaveformLine(
                          label: 'I',
                          color: const Color.fromARGB(255, 69, 241, 21),
                          waveformType: WaveformType.ecgI,
                          bpm: _bpm,
                        ),
                      ),
                      Expanded(
                        child: WaveformLine(
                          label: 'II',
                          color: const Color.fromARGB(255, 232, 49, 207),
                          waveformType: WaveformType.ecgII,
                          bpm: _bpm,
                        ),
                      ),
                      Expanded(
                        child: WaveformLine(
                          label: 'III',
                          color: const Color.fromARGB(255, 110, 110, 250),
                          waveformType: WaveformType.ecgIII,
                          bpm: _bpm,
                        ),
                      ),
                      Expanded(
                        child: Co2Waveform(color: Colors.orangeAccent, label: 'CO2'),
                      ),
                      Expanded(
                        child: RespiratoryWaveform(label: 'Resp', color: Colors.yellow),
                      ),
                    ],
                  ),
                ),

                // Right side: Vitals with SpO2 callbacks
                Expanded(
                  flex: 1,
                  child: VitalsPanel(
                    bpm: _bpm,
                    onIncreaseSpO2Range: _increaseSpO2Range,
                    onDecreaseSpO2Range: _decreaseSpO2Range,
                    currentSpO2Range: '$_lowerSpO2-$_upperSpO2',
                  ),
                ),
              ],
            ),
          ),

          // Bottom button bar with BPM callbacks
          // Bottom button bar with BPM AND SpO2 callbacks
          MonitorButtonBar(
            onIncreaseBpm: _increaseBpmRange,
            onDecreaseBpm: _decreaseBpmRange,
            onIncreaseBpmFast: _increaseBpmRangeFast,
            onDecreaseBpmFast: _decreaseBpmRangeFast,
            currentBpmRange: '$_lowerBpm-$_upperBpm',
            onIncreaseSpO2: _increaseSpO2Range, // ADD THIS LINE
            onDecreaseSpO2: _decreaseSpO2Range, // ADD THIS LINE
            currentSpO2Range: '$_lowerSpO2-$_upperSpO2', // ADD THIS LINE
          ),
        ],
      ),
    );
  }
}
