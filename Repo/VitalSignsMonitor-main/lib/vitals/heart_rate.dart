import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:get_it/get_it.dart';
import 'package:heart_monitor/settings.dart';
import 'package:heart_monitor/widgets/alarms_widget.dart';

class HeartRateDisplay extends StatefulWidget {
  final int bpm;
  const HeartRateDisplay({super.key, required this.bpm});

  @override
  State<HeartRateDisplay> createState() => _HeartRateDisplayState();
}

class _HeartRateDisplayState extends State<HeartRateDisplay> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _hasAlerted = false;
  final AudioPlayer _audioPlayer = AudioPlayer();
  final SettingsService settings = GetIt.I<SettingsService>();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: (60000 / widget.bpm.clamp(30, 200)).round()),
      vsync: this,
    )..repeat();

    _checkAndPlayAlert();
  }

  @override
  void didUpdateWidget(HeartRateDisplay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.bpm != oldWidget.bpm) {
      _controller.duration = Duration(milliseconds: (60000 / widget.bpm.clamp(30, 200)).round());
      if (!_controller.isAnimating) {
        _controller.repeat();
      }

      _checkAndPlayAlert();
    }
  }

  void _checkAndPlayAlert() async {
    if (widget.bpm > 100) {
      if (!_hasAlerted && settings.alarmsEnabled) {
        await _audioPlayer.stop();
        await _audioPlayer.play(AssetSource('sounds/beep.wav'));
        _hasAlerted = true;
      }
    } else {
      _hasAlerted = false;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isHigh = widget.bpm > 100;

    return SizedBox(
      width: double.infinity,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final flashing = _controller.value < 0.5;

          return Stack(
            children: [
              // Top-left label and blinking heart icon
              Positioned(
                top: 0,
                left: 0,
                child: Row(
                  children: [
                    Text('HR', style: TextStyle(color: Colors.greenAccent.shade400, fontSize: 16)),
                    const SizedBox(width: 8),
                    Icon(flashing ? Icons.favorite : Icons.favorite_border, color: Colors.redAccent, size: 24),
                  ],
                ),
              ),

              // Top-right: Pacing Off + bpm
              Positioned(
                top: 0,
                right: 8,
                child: Row(
                  children: [
                    AlarmsStatusWidget(),
                    const SizedBox(width: 10),
                    Text(
                      'Pace Off',
                      style: TextStyle(color: Colors.greenAccent.shade400, fontSize: 12, fontFamily: 'Arial'),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'bpm',
                      style: TextStyle(color: Colors.greenAccent.shade400, fontSize: 12, fontFamily: 'Arial'),
                    ),
                  ],
                ),
              ),

              // Centered BPM display
              Center(
                child: isHigh
                    ? Container(
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 40),
                        decoration: BoxDecoration(
                          color: flashing ? Colors.red : Colors.transparent,
                          border: Border.all(color: Colors.red, width: 4),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          widget.bpm.toString(),
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 80,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Nimbus',
                          ),
                        ),
                      )
                    : Text(
                        widget.bpm.toString(),
                        style: TextStyle(
                          color: const Color.fromARGB(255, 42, 255, 74),
                          fontSize: 80,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Nimbus',
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
