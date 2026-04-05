import 'package:flutter/material.dart';
import 'dart:async';

class TopStatusBar extends StatefulWidget {
  const TopStatusBar({super.key});

  @override
  State<TopStatusBar> createState() => _TopStatusBarState();
}

class _TopStatusBarState extends State<TopStatusBar> {
  late Timer _timer;
  String _timeString = '';

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _updateTime();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _updateTime() {
    final now = DateTime.now();
    setState(() {
      _timeString = "${now.year}-${_2(now.month)}-${_2(now.day)} ${_2(now.hour)}:${_2(now.minute)}:${_2(now.second)}";
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      color: const Color(0xFF3B7A6C), // Pale green/teal from the monitor image
      width: double.infinity,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            "BED 1  Adult ",
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              fontFamily: 'EuroStyle',
              letterSpacing: 1,
            ),
          ),
          Container(
            padding: EdgeInsets.all(8),
            child: Text(
              '⚠️ This is a simulation for demonstration and entertainment purposes only. It is not intended for medical use.',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),
          Row(
            children: [
              Text(
                _timeString,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'EuroStyle',
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(width: 10),
              const Icon(Icons.battery_full, size: 20, color: Colors.white),
            ],
          ),
        ],
      ),
    );
  }

  String _2(int n) => n.toString().padLeft(2, '0');
}
