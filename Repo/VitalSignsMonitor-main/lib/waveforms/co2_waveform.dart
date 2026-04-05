import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

class Co2Waveform extends StatefulWidget {
  final Color color;
  final String label;

  const Co2Waveform({super.key, required this.color, this.label = 'CO₂'});

  @override
  State<Co2Waveform> createState() => _Co2WaveformState();
}

class _Co2WaveformState extends State<Co2Waveform> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  final List<double> _buffer = List<double>.filled(500, 0.5, growable: true);
  List<double> _template = [];
  final Random _random = Random();

  double _dataIndex = 0.0;
  double _amplitudeVariation = 1.0;
  double _baselineDrift = 0.0;
  double _speedVariation = 1.0;

  int _nextAmplitudeChange = 0;
  int _nextTemplateChange = 0;
  int _nextBaselineChange = 0;
  int _nextSpeedChange = 0;
  int _nextArtifactCheck = 0;
  int _tickCount = 0;

  BreathPattern _currentPattern = BreathPattern.normal;
  int _nextPatternChange = 0;

  @override
  void initState() {
    super.initState();
    _template = _generateCapnographyTemplate();
    _ticker = createTicker((_) {
      setState(() {
        _generateNextPoint();
      });
    })..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _generateNextPoint() {
    _tickCount++;

    // Change amplitude more frequently with wider range
    if (_tickCount >= _nextAmplitudeChange) {
      _amplitudeVariation = 0.4 + _random.nextDouble() * 1.2; // 0.4 - 1.6 (much wider range)
      _nextAmplitudeChange = _tickCount + 50 + _random.nextInt(150); // More frequent changes
    }

    // Change baseline drift
    if (_tickCount >= _nextBaselineChange) {
      _baselineDrift = (_random.nextDouble() - 0.5) * 0.3; // -0.15 to 0.15
      _nextBaselineChange = _tickCount + 100 + _random.nextInt(200);
    }

    // Change speed variation
    if (_tickCount >= _nextSpeedChange) {
      _speedVariation = 0.5 + _random.nextDouble() * 1.5; // 0.5 - 2.0 (breathing rate variation)
      _nextSpeedChange = _tickCount + 80 + _random.nextInt(120);
    }

    // Change breathing pattern
    if (_tickCount >= _nextPatternChange) {
      _currentPattern = BreathPattern.values[_random.nextInt(BreathPattern.values.length)];
      _nextPatternChange = _tickCount + 300 + _random.nextInt(500);
    }

    // Generate new template more frequently
    if (_tickCount >= _nextTemplateChange) {
      _template = _generateCapnographyTemplate();
      _nextTemplateChange = _tickCount + 150 + _random.nextInt(200); // More frequent template changes
    }

    // Check for artifacts (occasional irregularities)
    if (_tickCount >= _nextArtifactCheck) {
      if (_random.nextDouble() < 0.05) {
        // 5% chance of artifact
        _addArtifact();
      }
      _nextArtifactCheck = _tickCount + 50 + _random.nextInt(100);
    }

    // Variable step size based on current speed variation
    final double baseStep = 1.0;
    final double step = baseStep * _speedVariation * (0.9 + _random.nextDouble() * 0.2); // Additional micro-variations
    _dataIndex += step;

    if (_dataIndex >= _template.length) {
      _dataIndex -= _template.length;
    }

    // Interpolate between template points
    final int i0 = _dataIndex.floor();
    final int i1 = (i0 + 1) % _template.length;
    final double frac = _dataIndex - i0;
    double value = _template[i0] * (1 - frac) + _template[i1] * frac;

    // Apply pattern-specific modifications
    value = _applyBreathPattern(value);

    // Add significant noise variation
    final double noiseLevel = 0.01 + _random.nextDouble() * 0.04; // Variable noise level
    final double noise = (_random.nextDouble() - 0.5) * noiseLevel;

    // Combine all variations
    final double finalValue = (value * _amplitudeVariation + noise + _baselineDrift).clamp(-0.5, 1.0);

    _buffer.add(0.5 - finalValue * 0.4);
    if (_buffer.length > 500) {
      _buffer.removeAt(0);
    }
  }

  double _applyBreathPattern(double value) {
    switch (_currentPattern) {
      case BreathPattern.shallow:
        return value * 0.6; // Shallow breathing
      case BreathPattern.deep:
        return value * 1.4; // Deep breathing
      case BreathPattern.irregular:
        // Add random distortions
        if (_random.nextDouble() < 0.3) {
          return value * (0.7 + _random.nextDouble() * 0.6);
        }
        return value;
      case BreathPattern.rapid:
        // Pattern handled by speed variation
        return value * (0.8 + _random.nextDouble() * 0.4);
      case BreathPattern.normal:
        return value;
    }
  }

  void _addArtifact() {
    // Add sudden spikes, drops, or distortions
    final artifactType = _random.nextInt(3);
    final artifactLength = 5 + _random.nextInt(15);

    for (int i = 0; i < artifactLength && _buffer.isNotEmpty; i++) {
      double artifactValue;
      switch (artifactType) {
        case 0: // Spike
          artifactValue = 0.2 + _random.nextDouble() * 0.3;
          break;
        case 1: // Drop
          artifactValue = 0.7 + _random.nextDouble() * 0.2;
          break;
        case 2: // Oscillation
          artifactValue = 0.5 + sin(i * 2) * 0.1;
          break;
        default:
          artifactValue = 0.5;
      }

      if (_buffer.isNotEmpty) {
        _buffer[_buffer.length - 1] = artifactValue;
      }
    }
  }

  List<double> _generateCapnographyTemplate() {
    // Much more variable template generation
    final int baseLength = 60;
    final int lengthVariation = _random.nextInt(40); // 60-100 length
    final int length = baseLength + lengthVariation;
    final List<double> template = [];

    // Random parameters for this breath cycle
    final double inspiratorySlope = 2.0 + _random.nextDouble() * 3.0; // 2-5
    final double plateauLevel = 0.45 + _random.nextDouble() * 0.15; // 0.45-0.6
    final double plateauVariation = _random.nextDouble() * 0.05; // Plateau fluctuation
    final double expiratorySlope = 3.0 + _random.nextDouble() * 4.0; // 3-7
    final double baselineLevel = 0.05 + _random.nextDouble() * 0.1; // 0.05-0.15

    for (int i = 0; i < length; i++) {
      double x = i / length;
      double value;

      if (x < 0.15) {
        // Inspiratory upstroke - variable steepness
        double progress = x / 0.15;
        value = baselineLevel + progress * (plateauLevel - baselineLevel) * inspiratorySlope / 3.0;
        value = value.clamp(baselineLevel, plateauLevel);
      } else if (x < 0.55) {
        // Plateau with variation
        double plateauProgress = (x - 0.15) / 0.4;
        double fluctuation = sin(plateauProgress * pi * (3 + _random.nextDouble() * 4)) * plateauVariation;
        value = plateauLevel + fluctuation;

        // Occasional plateau irregularities
        if (_random.nextDouble() < 0.1) {
          value += (_random.nextDouble() - 0.5) * 0.08;
        }
      } else if (x < 0.7) {
        // Expiratory downstroke - variable steepness
        double progress = (x - 0.55) / 0.15;
        value = plateauLevel - progress * (plateauLevel - baselineLevel) * expiratorySlope / 3.0;
        value = value.clamp(baselineLevel, plateauLevel);
      } else {
        // Baseline with variation
        double baselineProgress = (x - 0.7) / 0.3;
        double baselineWander = sin(baselineProgress * pi * 2) * 0.02;
        value = baselineLevel + baselineWander;

        // Occasional baseline artifacts
        if (_random.nextDouble() < 0.05) {
          value += (_random.nextDouble() - 0.5) * 0.03;
        }
      }

      template.add(value);
    }

    return template;
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        CustomPaint(painter: _WaveformPainter(_buffer, widget.color), size: Size.infinite),
        Positioned(
          top: 4,
          left: 10,
          child: Text(
            widget.label,
            style: TextStyle(
              color: widget.color,
              fontSize: 14,
              fontWeight: FontWeight.bold,
              shadows: const [Shadow(blurRadius: 2.0, color: Colors.black)],
            ),
          ),
        ),
        // Optional: Show current pattern for debugging
        Positioned(
          top: 4,
          right: 10,
          child: Text(
            _currentPattern.name.toUpperCase(),
            style: TextStyle(color: widget.color.withOpacity(0.7), fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}

enum BreathPattern { normal, shallow, deep, irregular, rapid }

class _WaveformPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  final Paint _paint;

  _WaveformPainter(this.data, this.color)
    : _paint = Paint()
        ..color = color
        ..strokeWidth = 2.0
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    final path = Path();
    final double dx = size.width / (data.length - 1);
    path.moveTo(0, data.first * size.height);
    for (int i = 1; i < data.length; i++) {
      final double x = i * dx;
      final double y = data[i] * size.height;
      path.lineTo(x, y);
    }
    canvas.drawPath(path, _paint);
  }

  @override
  bool shouldRepaint(covariant _WaveformPainter oldDelegate) => true;
}
