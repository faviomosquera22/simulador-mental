import 'package:flutter/material.dart';
import 'package:heart_monitor/vitals/heart_rate.dart';
import 'package:heart_monitor/vitals/nibp.dart';
import 'package:heart_monitor/vitals/respiratory_rate.dart';
import 'package:heart_monitor/vitals/spo2.dart';

class VitalsPanel extends StatelessWidget {
  final int bpm;
  final VoidCallback? onIncreaseSpO2Range;
  final VoidCallback? onDecreaseSpO2Range;
  final String? currentSpO2Range;

  const VitalsPanel({
    super.key,
    required this.bpm,
    this.onIncreaseSpO2Range,
    this.onDecreaseSpO2Range,
    this.currentSpO2Range,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      padding: const EdgeInsets.fromLTRB(10, 20, 10, 20),
      child: Column(
        children: [
          // Expanded Heart Rate display to give it more space
          Expanded(flex: 2, child: HeartRateDisplay(bpm: bpm)),
          // Other vitals grouped below
          Expanded(
            flex: 3,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                NIBPDisplay(bpm: bpm),
                SpO2Display(
                  onIncreaseSpO2Range: onIncreaseSpO2Range,
                  onDecreaseSpO2Range: onDecreaseSpO2Range,
                  currentSpO2Range: currentSpO2Range,
                ),
                RespiratoryRateDisplay(),
                const VitalDisplay(label: "TEMP", value: "36.8", color: Colors.orangeAccent, unit: "°C"),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Standard VitalDisplay for other vitals
class VitalDisplay extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color color;

  const VitalDisplay({super.key, required this.label, required this.value, required this.unit, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          label,
          style: TextStyle(fontFamily: 'VarelaRound', color: color, fontSize: 20, fontWeight: FontWeight.w600),
        ),
        const SizedBox(width: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              value,
              style: TextStyle(fontFamily: 'VarelaRound', color: color, fontSize: 38, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 4),
            Text(
              unit,
              style: TextStyle(fontFamily: 'VarelaRound', color: color, fontSize: 16),
            ),
          ],
        ),
      ],
    );
  }
}
