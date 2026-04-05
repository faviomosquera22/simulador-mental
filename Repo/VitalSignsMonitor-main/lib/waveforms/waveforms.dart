import 'dart:async';
import 'dart:math' as math;
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:get_it/get_it.dart';
import 'package:heart_monitor/settings.dart';

enum WaveformType { ecgI, ecgII, ecgIII, pleth, resp }

class WaveformLine extends StatefulWidget {
  final String label;
  final Color color;
  final WaveformType waveformType;
  final int bpm;

  const WaveformLine({
    super.key,
    required this.label,
    required this.color,
    required this.waveformType,
    required this.bpm,
  });

  @override
  State<WaveformLine> createState() => _WaveformLineState();
}

class _WaveformLineState extends State<WaveformLine> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  final SettingsService settings = GetIt.I<SettingsService>();
  // Buffer to hold the waveform data points for rendering.
  final List<double> _buffer = List<double>.filled(500, 0.5, growable: true);
  final math.Random _random = math.Random();

  // The base template for the current waveform.
  late List<double> _template;

  // State variables for managing waveform generation.
  double _dataIndex = 0.0;
  int _tickCount = 0;
  bool _isAlerting = false; // For visual alarm effect

  // Variables for managing random events.
  int _nextBeatDropTick = -1;
  int _nextPvcTick = -1;
  bool _isPvc = false;
  int _pvcDuration = 0;
  int _postPvcPause = 0;

  // Variables for adding natural variability.
  double _heartRateVariability = 0.0;
  int _nextHrvChange = 0;
  double _amplitudeVariability = 1.0;
  int _nextAmplitudeChange = 0;

  @override
  void initState() {
    super.initState();
    _initializeWaveform();

    _ticker = createTicker((_) {
      if (!mounted) return;
      setState(() {
        _generateNextPoint();
      });
    })..start();
  }

  @override
  void didUpdateWidget(WaveformLine oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.bpm != widget.bpm) {
      // Regenerate template when BPM changes
      _template = _generateTemplate(widget.waveformType);
    }
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _triggerAlert() {
    if (settings.alarmsEnabled) {
      AudioPlayer().stop(); // Stop any previous sound
      AudioPlayer().play(AssetSource('sounds/beep.wav'));
    }

    if (!mounted) return;
    setState(() => _isAlerting = true);
    // Keep the visual alert on for a short duration
    Timer(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      setState(() => _isAlerting = false);
    });
  }

  void _playHeartbeatSound() {
    if (settings.playBeats && mounted) {
      AudioPlayer().stop(); // Stop any previous sound
      AudioPlayer().play(AssetSource('sounds/beat.wav'));
    }
  }

  void _initializeWaveform() {
    _template = _generateTemplate(widget.waveformType);
    _scheduleNextRandomEvents();
  }

  void _scheduleNextRandomEvents() {
    _nextPvcTick = _tickCount + 300 + _random.nextInt(1200);
    _nextBeatDropTick = _tickCount + 900 + _random.nextInt(1800);
  }

  void _generateNextPoint() {
    _tickCount++;

    if (widget.waveformType.name.startsWith('ecg')) {
      if (_tickCount == _nextBeatDropTick) {
        _template = _generateEcgTemplate(widget.waveformType, isDropped: true);
        _dataIndex = 0.0;
        _nextBeatDropTick = _tickCount + 900 + _random.nextInt(1800);
        _triggerAlert(); // Trigger alert on dropped beat
      } else if (_tickCount == _nextPvcTick && !_isPvc) {
        _isPvc = true;
        _template = _generateEcgTemplate(widget.waveformType, isPvc: true);
        _dataIndex = 0.0;
        _pvcDuration = _template.length;
        _postPvcPause = (_template.length * 0.5).toInt();
        _triggerAlert(); // Trigger alert on PVC
      }
    }

    if (_tickCount >= _nextHrvChange) {
      _heartRateVariability = (_random.nextDouble() - 0.5) * 0.2;
      _nextHrvChange = _tickCount + 120 + _random.nextInt(180);
    }

    if (_tickCount >= _nextAmplitudeChange) {
      if (widget.waveformType == WaveformType.pleth || widget.waveformType == WaveformType.resp) {
        _amplitudeVariability = 0.8 + _random.nextDouble() * 0.4;
        _template = _generateTemplate(widget.waveformType);
        _dataIndex = 0.0;
      } else if (widget.waveformType.name.startsWith('ecg')) {
        // Regenerate ECG template for natural beat-to-beat variation
        _template = _generateEcgTemplate(widget.waveformType);
        _dataIndex = 0.0;
      }
      _nextAmplitudeChange = _tickCount + 180 + _random.nextInt(300);
    }

    if (_isPvc) {
      if (_pvcDuration > 0) {
        _pvcDuration--;
      } else if (_postPvcPause > 0) {
        _postPvcPause--;
        _buffer.add(0.5);
        return;
      } else {
        _isPvc = false;
        _template = _generateEcgTemplate(widget.waveformType);
        _dataIndex = 0.0;
        _scheduleNextRandomEvents();
        // Play a slightly different sound after PVC recovery (only on Lead II)
        if (widget.waveformType == WaveformType.ecgII && settings.playBeats) {
          _playHeartbeatSound();
        }
      }
    }

    if (widget.waveformType.name.startsWith('ecg') || widget.waveformType == WaveformType.pleth) {
      final double beatsPerSecond = widget.bpm / 60.0;
      final double pointsPerBeat = _template.length.toDouble();
      final double pointsPerSecond = pointsPerBeat * beatsPerSecond;
      final double step = pointsPerSecond / 60.0;
      _dataIndex += step * (1.0 + _heartRateVariability);
    } else {
      _dataIndex += 0.5;
    }

    if (_dataIndex >= _template.length) {
      _dataIndex -= _template.length;
      if (widget.waveformType.name.startsWith('ecg')) {
        // Play heartbeat sound on Lead II only (to avoid multiple sounds per beat)
        // Skip sound during PVCs, but play after PVC recovery and for normal beats
        if (widget.waveformType == WaveformType.ecgII && settings.playBeats && !_isPvc) {
          _playHeartbeatSound();
        }
        // Generate new ECG template for next beat (natural variation)
        _template = _generateEcgTemplate(widget.waveformType);
        _dataIndex = 0.0;
      }
    }

    final int i0 = _dataIndex.floor();
    final int i1 = (i0 + 1) % _template.length;
    final double frac = _dataIndex - i0;
    final double value = _template[i0] * (1 - frac) + _template[i1] * frac;

    final double baselineWander = math.sin(_tickCount / 200.0) * 0.02;
    final double noise = (_random.nextDouble() - 0.5) * 0.015;
    final double finalValue = value + baselineWander + noise;

    _buffer.add(0.5 - finalValue * 0.4);
    if (_buffer.length > 500) {
      _buffer.removeAt(0);
    }
  }

  List<double> _generateTemplate(WaveformType type) {
    switch (type) {
      case WaveformType.ecgI:
      case WaveformType.ecgII:
      case WaveformType.ecgIII:
        return _generateEcgTemplate(type);
      case WaveformType.pleth:
        return _generatePlethTemplate();
      case WaveformType.resp:
        return _generateRespTemplate();
    }
  }

  List<double> _generatePlethTemplate() {
    final List<double> template = [];
    const int length = 60;
    for (int i = 0; i < length; i++) {
      double x = i / length;
      double upstroke = math.pow(x, 2) * math.exp(-12 * x) * 12;
      double notch = math.pow(x, 10) * math.exp(-25 * x) * 2;
      double point = upstroke - notch;
      template.add(point * _amplitudeVariability);
    }
    return template;
  }

  List<double> _generateRespTemplate() {
    final List<double> template = [];
    int length = 200 + _random.nextInt(100);
    for (int i = 0; i < length; i++) {
      double x = i * (2 * math.pi / length);
      template.add(math.sin(x) * _amplitudeVariability);
    }
    return template;
  }

  List<double> _generateRealisticEcgLeadI(int bpm, {bool isPvc = false, bool isDropped = false}) {
    if (isDropped) {
      // Return flat line for dropped beat
      final int droppedLength = (60.0 / bpm * 60).round(); // One beat cycle worth of flat
      return List.filled(droppedLength, 0.0);
    }
    
    if (isPvc) {
      // PVC: Wide, bizarre QRS complex
      return [
        0.0, 0.0, 0.0, 0.0,  // No P wave
        -0.3, -0.4, -0.2,    // Wide Q wave
        1.4, 1.6, 1.2, 0.8,  // Wide R wave  
        -0.8, -1.0, -0.6, -0.3, // Deep S wave
        0.1, 0.2, 0.4, 0.5, 0.3, 0.1, // Wide T wave
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 // Compensatory pause
      ];
    }

    // Calculate timing based on BPM for realistic intervals
    final double beatDurationMs = 60000.0 / bpm; // Total beat duration in ms
    final int totalPoints = (beatDurationMs / 16.67).round(); // ~60fps timing
    
    // Standard ECG intervals (in ms) - these are physiologically accurate
    final double pWaveDuration = 100.0; // P wave duration
    final double prInterval = 160.0;    // PR interval (start of P to start of QRS)
    final double qrsDuration = 100.0;   // QRS duration
    final double qtInterval = math.min(450.0, beatDurationMs * 0.4); // QT interval varies with rate
    final double tWaveDuration = 160.0; // T wave duration
    
    // Convert to point indices
    final int pWavePoints = (pWaveDuration / 16.67).round();
    final int prPoints = (prInterval / 16.67).round();
    final int qrsPoints = (qrsDuration / 16.67).round();
    final int qtPoints = (qtInterval / 16.67).round();
    final int tWavePoints = (tWaveDuration / 16.67).round();
    
    final List<double> template = List.filled(totalPoints, 0.0);
    
    // Add random beat-to-beat variability
    final double pAmplitude = 0.15 + _random.nextDouble() * 0.1; // P wave: 0.15-0.25
    final double rAmplitude = 0.8 + _random.nextDouble() * 0.4;  // R wave: 0.8-1.2
    final double qAmplitude = -(0.05 + _random.nextDouble() * 0.1); // Q wave: -0.05 to -0.15
    final double sAmplitude = -(0.1 + _random.nextDouble() * 0.2);  // S wave: -0.1 to -0.3
    final double tAmplitude = 0.2 + _random.nextDouble() * 0.2;   // T wave: 0.2-0.4
    
    // Slight timing variations (heart rate variability)
    final double timingVariation = 1.0 + (_random.nextDouble() - 0.5) * 0.1; // ±5% timing variation
    
    int currentIndex = 0;
    
    // 1. Baseline before P wave (isoelectric)
    final int baselineStart = (10 * timingVariation).round();
    currentIndex += baselineStart;
    
    // 2. P wave (atrial depolarization) - smooth positive deflection
    final int pStart = currentIndex;
    final int pEnd = currentIndex + (pWavePoints * timingVariation).round();
    for (int i = pStart; i < pEnd && i < template.length; i++) {
      double progress = (i - pStart) / (pEnd - pStart);
      // Smooth bell curve for P wave
      template[i] = pAmplitude * math.exp(-math.pow((progress - 0.5) * 4, 2));
    }
    currentIndex = pEnd;
    
    // 3. PR segment (isoelectric - AV node delay)
    final int prSegmentEnd = (prPoints * timingVariation).round();
    currentIndex = math.min(prSegmentEnd, template.length - qrsPoints - tWavePoints);
    
    // 4. QRS Complex (ventricular depolarization)
    final int qrsStart = currentIndex;
    final int qrsEnd = currentIndex + (qrsPoints * timingVariation).round();
    
    if (qrsEnd < template.length) {
      final int qrsLength = qrsEnd - qrsStart;
      
      // Q wave (small negative deflection) - first 20% of QRS
      final int qEnd = qrsStart + (qrsLength * 0.2).round();
      for (int i = qrsStart; i < qEnd && i < template.length; i++) {
        double progress = (i - qrsStart) / (qEnd - qrsStart);
        template[i] = qAmplitude * math.sin(progress * math.pi);
      }
      
      // R wave (large positive spike) - middle 40% of QRS  
      final int rStart = qEnd;
      final int rEnd = qrsStart + (qrsLength * 0.6).round();
      for (int i = rStart; i < rEnd && i < template.length; i++) {
        double progress = (i - rStart) / (rEnd - rStart);
        // Sharp spike with slight asymmetry
        template[i] = rAmplitude * math.pow(math.sin(progress * math.pi), 0.7);
      }
      
      // S wave (negative deflection) - last 40% of QRS
      final int sStart = rEnd;
      for (int i = sStart; i < qrsEnd && i < template.length; i++) {
        double progress = (i - sStart) / (qrsEnd - sStart);
        template[i] = sAmplitude * math.sin(progress * math.pi);
      }
    }
    currentIndex = qrsEnd;
    
    // 5. ST segment (brief isoelectric segment)
    final int stSegmentDuration = (40 / 16.67 * timingVariation).round(); // ~40ms
    currentIndex += stSegmentDuration;
    
    // 6. T wave (ventricular repolarization) - smooth positive wave
    final int tStart = math.min(currentIndex, template.length - tWavePoints);
    final int tEnd = math.min(tStart + (tWavePoints * timingVariation).round(), template.length);
    
    for (int i = tStart; i < tEnd; i++) {
      double progress = (i - tStart) / (tEnd - tStart);
      // Asymmetric T wave (slower upstroke, faster downstroke)
      double tValue;
      if (progress < 0.3) {
        // Gradual upstroke
        tValue = tAmplitude * (progress / 0.3) * 0.5;
      } else if (progress < 0.7) {
        // Peak
        double peakProgress = (progress - 0.3) / 0.4;
        tValue = tAmplitude * (0.5 + 0.5 * math.sin(peakProgress * math.pi));
      } else {
        // Faster downstroke
        double downProgress = (progress - 0.7) / 0.3;
        tValue = tAmplitude * (1.0 - downProgress);
      }
      template[i] = tValue;
    }
    
    // 7. Rest of cycle remains at baseline (diastole)
    
    // Add subtle morphology variations
    for (int i = 0; i < template.length; i++) {
      // Very small random noise
      template[i] += (_random.nextDouble() - 0.5) * 0.02;
      
      // Slight baseline wander
      template[i] += math.sin(i * 0.05) * 0.01;
    }
    
    return template;
  }

  List<double> _generateEcgTemplate(WaveformType type, {bool isPvc = false, bool isDropped = false}) {
    switch (type) {
      case WaveformType.ecgI:
        return _generateRealisticEcgLeadI(widget.bpm, isPvc: isPvc, isDropped: isDropped);
      case WaveformType.ecgII:
        // Lead II typically has larger amplitude than Lead I
        var leadI = _generateRealisticEcgLeadI(widget.bpm, isPvc: isPvc, isDropped: isDropped);
        return leadI.map((value) => value * 1.3).toList(); // Amplify by 30%
      case WaveformType.ecgIII:
        // Lead III can have inverted components compared to Lead I
        var leadI = _generateRealisticEcgLeadI(widget.bpm, isPvc: isPvc, isDropped: isDropped);
        return leadI.map((value) => -value * 0.8).toList(); // Invert and reduce amplitude
      default:
        return [0.0];
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        border: _isAlerting
            ? Border.all(color: Colors.red, width: 2.0)
            : Border.all(color: Colors.transparent, width: 2.0),
      ),
      child: Stack(
        children: [
          CustomPaint(painter: WaveformPainter(_buffer, widget.color), size: Size.infinite),
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
        ],
      ),
    );
  }
}

class WaveformPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  final Paint _paint;

  WaveformPainter(this.data, this.color)
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
  bool shouldRepaint(covariant WaveformPainter oldDelegate) {
    return true;
  }
}