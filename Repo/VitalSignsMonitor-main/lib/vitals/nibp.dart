import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class NIBPDisplay extends StatefulWidget {
  final int bpm; // live bpm passed in
  final int systolicLow;
  final int systolicHigh;
  final int diastolicLow;
  final int diastolicHigh;

  const NIBPDisplay({
    super.key,
    required this.bpm,
    this.systolicLow = 100,
    this.systolicHigh = 140,
    this.diastolicLow = 60,
    this.diastolicHigh = 90,
  });

  @override
  State<NIBPDisplay> createState() => _NIBPDisplayState();
}

class _NIBPDisplayState extends State<NIBPDisplay> {
  late int systolic;
  late int diastolic;
  late Timer _timer;
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _randomizeValues();
    _startTimer();
  }

  void _startTimer() {
    final delay = Duration(seconds: 30 + _random.nextInt(31)); // 30–60 sec
    _timer = Timer(delay, () {
      if (!mounted) return;
      setState(() {
        _randomizeValues();
      });
      _startTimer(); // schedule next update
    });
  }

  void _randomizeValues() {
    systolic = widget.systolicLow + _random.nextInt(widget.systolicHigh - widget.systolicLow + 1);
    diastolic = widget.diastolicLow + _random.nextInt(widget.diastolicHigh - widget.diastolicLow + 1);
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final int map = (diastolic + (systolic - diastolic) / 3).round();
    final now = DateTime.now();
    final String timestamp = "${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}";

    const double labelFontSize = 12;
    final Color labelColor = const Color.fromARGB(255, 227, 143, 242).withOpacity(0.8);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Top row: NIBP Label, Timestamp, Unit
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'NIBP',
              style: TextStyle(color: Color.fromARGB(255, 216, 106, 235), fontSize: 12, fontWeight: FontWeight.w600),
            ),
            Text(
              timestamp,
              style: TextStyle(color: labelColor, fontSize: labelFontSize),
            ),
            Text(
              'mmHg',
              style: TextStyle(color: labelColor, fontSize: labelFontSize),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Middle row: BP and MAP
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            const SizedBox.shrink(),
            Text(
              '$systolic/$diastolic',
              style: const TextStyle(
                color: Color.fromARGB(255, 209, 111, 226),
                fontSize: 42,
                fontWeight: FontWeight.bold,
                fontFamily: 'Nimbus',
              ),
            ),
            Text(
              '($map)',
              style: const TextStyle(color: Colors.purpleAccent, fontSize: 38, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Bottom row: Mode and Pulse bpm
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Manual',
              style: TextStyle(color: labelColor, fontSize: labelFontSize),
            ),
            Text(
              'Pulse ${widget.bpm}',
              style: TextStyle(color: labelColor, fontSize: labelFontSize),
            ),
          ],
        ),
      ],
    );
  }
}
