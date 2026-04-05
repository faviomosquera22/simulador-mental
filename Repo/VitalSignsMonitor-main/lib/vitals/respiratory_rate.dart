import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class RespiratoryRateDisplay extends StatefulWidget {
  final int minRR;
  final int maxRR;
  final int minIntervalSeconds;
  final int maxIntervalSeconds;

  const RespiratoryRateDisplay({
    super.key,
    this.minRR = 20,
    this.maxRR = 40,
    this.minIntervalSeconds = 10,
    this.maxIntervalSeconds = 20,
  });

  @override
  State<RespiratoryRateDisplay> createState() => _RespiratoryRateDisplayState();
}

class _RespiratoryRateDisplayState extends State<RespiratoryRateDisplay> {
  final Random _random = Random();
  late Timer _timer;
  int _rr = 20;

  @override
  void initState() {
    super.initState();
    _randomizeRR();
    _scheduleNextUpdate();
  }

  void _randomizeRR() {
    _rr = widget.minRR + _random.nextInt(widget.maxRR - widget.minRR + 1);
  }

  void _scheduleNextUpdate() {
    final delay = Duration(
      seconds: widget.minIntervalSeconds + _random.nextInt(widget.maxIntervalSeconds - widget.minIntervalSeconds + 1),
    );

    _timer = Timer(delay, () {
      setState(() {
        _randomizeRR();
      });
      _scheduleNextUpdate();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color color = const Color.fromARGB(255, 67, 132, 252);

    return Expanded(
      child: Row(
        children: [
          // Left-side label
          Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'RR',
                style: TextStyle(fontSize: 14, color: color, fontWeight: FontWeight.w600),
              ),
              SizedBox(height: 2),
              Text('30', style: TextStyle(fontSize: 10, color: color)),
              Text('8', style: TextStyle(fontSize: 10, color: color)),
            ],
          ),
          const SizedBox(width: 16),

          // Centered RR number
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _rr.toString(),
                  style: TextStyle(
                    color: color,
                    fontSize: 80,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Nimbus',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
