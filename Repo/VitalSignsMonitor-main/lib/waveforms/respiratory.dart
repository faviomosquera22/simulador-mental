import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

class RespiratoryWaveform extends StatefulWidget {
  final Color color;
  final String label;

  const RespiratoryWaveform({super.key, required this.color, this.label = 'RESP'});

  @override
  State<RespiratoryWaveform> createState() => _RespiratoryWaveformState();
}

class _RespiratoryWaveformState extends State<RespiratoryWaveform> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  final List<double> _buffer = List<double>.filled(500, 0.5, growable: true);
  List<double> _template = [];
  final Random _random = Random();

  double _dataIndex = 0.0;
  double _amplitudeVariation = 1.0;
  double _baselineDrift = 0.0;
  double _speedVariation = 1.0;
  double _asymmetryFactor = 1.0;
  
  int _nextAmplitudeChange = 0;
  int _nextTemplateChange = 0;
  int _nextBaselineChange = 0;
  int _nextSpeedChange = 0;
  int _nextAsymmetryChange = 0;
  int _nextArtifactCheck = 0;
  int _nextApneaCheck = 0;
  int _tickCount = 0;
  
  // Respiratory pattern types
  RespiratoryPattern _currentPattern = RespiratoryPattern.normal;
  int _nextPatternChange = 0;
  bool _inApneaEpisode = false;
  int _apneaEndTick = 0;

  @override
  void initState() {
    super.initState();
    _template = _generateRespiratoryTemplate();
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

    // Handle apnea episodes
    if (_tickCount >= _nextApneaCheck) {
      if (_random.nextDouble() < 0.02 && !_inApneaEpisode) { // 2% chance of apnea
        _inApneaEpisode = true;
        _apneaEndTick = _tickCount + 100 + _random.nextInt(200); // 100-300 tick apnea
      }
      _nextApneaCheck = _tickCount + 500 + _random.nextInt(1000);
    }

    if (_inApneaEpisode && _tickCount >= _apneaEndTick) {
      _inApneaEpisode = false;
    }

    // Change amplitude (respiratory effort)
    if (_tickCount >= _nextAmplitudeChange) {
      _amplitudeVariation = 0.3 + _random.nextDouble() * 1.4; // 0.3 - 1.7 (wide range)
      _nextAmplitudeChange = _tickCount + 60 + _random.nextInt(180);
    }

    // Change baseline drift (patient position/movement)
    if (_tickCount >= _nextBaselineChange) {
      _baselineDrift = (_random.nextDouble() - 0.5) * 0.4; // -0.2 to 0.2
      _nextBaselineChange = _tickCount + 120 + _random.nextInt(200);
    }

    // Change breathing rate
    if (_tickCount >= _nextSpeedChange) {
      _speedVariation = 0.4 + _random.nextDouble() * 1.6; // 0.4 - 2.0 (very wide rate range)
      _nextSpeedChange = _tickCount + 100 + _random.nextInt(150);
    }

    // Change inspiration/expiration ratio asymmetry
    if (_tickCount >= _nextAsymmetryChange) {
      _asymmetryFactor = 0.7 + _random.nextDouble() * 0.6; // 0.7 - 1.3
      _nextAsymmetryChange = _tickCount + 80 + _random.nextInt(120);
    }

    // Change breathing pattern
    if (_tickCount >= _nextPatternChange) {
      List<RespiratoryPattern> availablePatterns = RespiratoryPattern.values;
      // Don't immediately switch to apnea if already in apnea episode
      if (_inApneaEpisode) {
        availablePatterns = availablePatterns.where((p) => p != RespiratoryPattern.apnea).toList();
      }
      _currentPattern = availablePatterns[_random.nextInt(availablePatterns.length)];
      _nextPatternChange = _tickCount + 400 + _random.nextInt(600);
    }

    // Generate new template
    if (_tickCount >= _nextTemplateChange) {
      _template = _generateRespiratoryTemplate();
      _nextTemplateChange = _tickCount + 200 + _random.nextInt(300);
    }

    // Check for movement artifacts
    if (_tickCount >= _nextArtifactCheck) {
      if (_random.nextDouble() < 0.08) { // 8% chance of artifact
        _addMovementArtifact();
      }
      _nextArtifactCheck = _tickCount + 40 + _random.nextInt(80);
    }

    // Handle apnea - flat line with minimal variation
    if (_inApneaEpisode) {
      double flatValue = 0.5 + _baselineDrift + (_random.nextDouble() - 0.5) * 0.02;
      _buffer.add(flatValue);
      if (_buffer.length > 500) {
        _buffer.removeAt(0);
      }
      return;
    }

    // Variable step size
    final double baseStep = 0.8; // Slower than CO2 (respirations are slower)
    final double step = baseStep * _speedVariation * (0.85 + _random.nextDouble() * 0.3);
    _dataIndex += step;

    if (_dataIndex >= _template.length) {
      _dataIndex -= _template.length;
    }

    // Interpolate between template points
    final int i0 = _dataIndex.floor();
    final int i1 = (i0 + 1) % _template.length;
    final double frac = _dataIndex - i0;
    double value = _template[i0] * (1 - frac) + _template[i1] * frac;

    // Apply respiratory pattern modifications
    value = _applyRespiratoryPattern(value);

    // Add noise (sensor movement, electrical interference)
    final double noiseLevel = 0.005 + _random.nextDouble() * 0.025;
    final double noise = (_random.nextDouble() - 0.5) * noiseLevel;
    
    // Combine all variations
    final double finalValue = (value * _amplitudeVariation + noise + _baselineDrift).clamp(-0.3, 1.3);

    _buffer.add(0.5 - finalValue * 0.35);
    if (_buffer.length > 500) {
      _buffer.removeAt(0);
    }
  }

  double _applyRespiratoryPattern(double value) {
    switch (_currentPattern) {
      case RespiratoryPattern.shallow:
        return value * 0.4; // Very shallow breathing
      case RespiratoryPattern.deep:
        return value * 1.6; // Deep breathing
      case RespiratoryPattern.irregular:
        // Random breath-to-breath variation
        if (_random.nextDouble() < 0.4) {
          return value * (0.5 + _random.nextDouble() * 1.0);
        }
        return value;
      case RespiratoryPattern.rapid:
        return value * 0.8; // Faster, shallower breaths
      case RespiratoryPattern.labored:
        // Increased effort, asymmetric pattern
        return value * (1.2 + sin(_dataIndex * 0.1) * 0.3);
      case RespiratoryPattern.cheyne_stokes:
        // Crescendo-decrescendo pattern
        double cyclePosition = (_tickCount % 1000) / 1000.0;
        double amplitude = sin(cyclePosition * pi);
        return value * (0.3 + amplitude * 1.2);
      case RespiratoryPattern.apnea:
        return 0.0; // Handled elsewhere
      case RespiratoryPattern.normal:
      return value;
    }
  }

  void _addMovementArtifact() {
    final artifactType = _random.nextInt(4);
    final artifactLength = 3 + _random.nextInt(12);
    
    for (int i = 0; i < artifactLength && _buffer.isNotEmpty; i++) {
      double artifactValue;
      switch (artifactType) {
        case 0: // Movement spike
          artifactValue = 0.1 + _random.nextDouble() * 0.4;
          break;
        case 1: // Baseline shift
          artifactValue = 0.3 + _random.nextDouble() * 0.4;
          break;
        case 2: // High frequency noise
          artifactValue = _buffer.isNotEmpty ? _buffer.last + (_random.nextDouble() - 0.5) * 0.15 : 0.5;
          break;
        case 3: // Damped oscillation
          artifactValue = 0.5 + sin(i * 3) * 0.1 * exp(-i * 0.3);
          break;
        default:
          artifactValue = 0.5;
      }
      
      if (_buffer.isNotEmpty) {
        _buffer[_buffer.length - 1] = artifactValue.clamp(0.0, 1.0);
      }
    }
  }

  List<double> _generateRespiratoryTemplate() {
    final int baseLength = 100;
    final int lengthVariation = _random.nextInt(60); // 100-160 length (longer than CO2)
    final int length = baseLength + lengthVariation;
    final List<double> template = [];

    // Respiratory parameters
    final double inspiratoryRatio = 0.3 + _random.nextDouble() * 0.2; // 0.3-0.5 (inspiration shorter)
    final double maxAmplitude = 0.4 + _random.nextDouble() * 0.3; // 0.4-0.7
    final double baselineLevel = 0.05 + _random.nextDouble() * 0.1; // 0.05-0.15
    final double expiratoryCurve = 1.5 + _random.nextDouble() * 1.0; // 1.5-2.5 (exponential decay)

    for (int i = 0; i < length; i++) {
      double x = i / length;
      double value;
      
      if (x < inspiratoryRatio) { // Inspiration phase
        double progress = x / inspiratoryRatio;
        // Sinusoidal inspiration with some asymmetry
        double baseInspiration = sin(progress * pi * 0.5);
        num asymmetry = pow(progress, _asymmetryFactor);
        value = baselineLevel + (maxAmplitude - baselineLevel) * (baseInspiration * 0.7 + asymmetry * 0.3);
        
        // Add some inspiratory flow variation
        if (_random.nextDouble() < 0.3) {
          value += sin(progress * pi * (4 + _random.nextDouble() * 3)) * 0.02;
        }
      } else { // Expiration phase
        double progress = (x - inspiratoryRatio) / (1.0 - inspiratoryRatio);
        // Exponential decay for expiration
        value = baselineLevel + (maxAmplitude - baselineLevel) * exp(-progress * expiratoryCurve);
        
        // Add expiratory flow irregularities
        if (_random.nextDouble() < 0.2) {
          value += (_random.nextDouble() - 0.5) * 0.03;
        }
        
        // Occasional expiratory pause
        if (progress > 0.7 && _random.nextDouble() < 0.1) {
          value = baselineLevel + (_random.nextDouble() - 0.5) * 0.01;
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
        CustomPaint(
          painter: _WaveformPainter(_buffer, widget.color),
          size: Size.infinite,
        ),
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
        // Show current pattern and special states
        Positioned(
          top: 4,
          right: 10,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _currentPattern.name.toUpperCase().replaceAll('_', '-'),
                style: TextStyle(
                  color: widget.color.withOpacity(0.7),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_inApneaEpisode)
                Text(
                  'APNEA',
                  style: TextStyle(
                    color: Colors.red.withOpacity(0.8),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

enum RespiratoryPattern {
  normal,
  shallow,
  deep,
  irregular,
  rapid,
  labored,
  cheyne_stokes,
  apnea,
}

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