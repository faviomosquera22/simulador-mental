import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:heart_monitor/settings.dart';

class MonitorButtonBar extends StatefulWidget {
  final VoidCallback? onIncreaseBpm;
  final VoidCallback? onDecreaseBpm;
  final VoidCallback? onIncreaseBpmFast;
  final VoidCallback? onDecreaseBpmFast;
  final String? currentBpmRange;
  final VoidCallback? onIncreaseSpO2;
  final VoidCallback? onDecreaseSpO2;
  final String? currentSpO2Range;

  const MonitorButtonBar({
    super.key,
    this.onIncreaseBpm,
    this.onDecreaseBpm,
    this.onIncreaseBpmFast,
    this.onDecreaseBpmFast,
    this.currentBpmRange,
    this.onIncreaseSpO2,
    this.onDecreaseSpO2,
    this.currentSpO2Range,
  });

  @override
  State<MonitorButtonBar> createState() => _MonitorButtonBarState();
}

class _MonitorButtonBarState extends State<MonitorButtonBar> {
  // Button configuration with default states, colors, and handlers
  late Map<String, ButtonConfig> _buttonConfigs;
  final SettingsService settings = GetIt.I<SettingsService>();

  @override
  void initState() {
    super.initState();
    _buttonConfigs = {
      'MENU': ButtonConfig(defaultOn: false, activeColor: Colors.blue, handler: () => _toggleMenu()),
      'ALARMS': ButtonConfig(
        defaultOn: true, // Alarms should be on by default
        activeColor: Colors.red,
        handler: () => _toggleAlarms(),
      ),
      'LEADS': ButtonConfig(defaultOn: false, activeColor: Colors.green, handler: () => _toggleLeads()),
      'PRINT': ButtonConfig(defaultOn: false, activeColor: Colors.purple, handler: () => _handlePrint()),
      'FREEZE': ButtonConfig(defaultOn: false, activeColor: Colors.orange, handler: () => _toggleFreeze()),
      'TRENDS': ButtonConfig(defaultOn: false, activeColor: Colors.cyan, handler: () => _toggleTrends()),
      'SETUP': ButtonConfig(defaultOn: false, activeColor: Colors.blue, handler: () => _toggleSetup()),
      'EVENTS': ButtonConfig(defaultOn: false, activeColor: Colors.indigo, handler: () => _toggleEvents()),
      '12-LEAD': ButtonConfig(defaultOn: false, activeColor: Colors.teal, handler: () => _toggle12Lead()),
      'NIBP': ButtonConfig(defaultOn: false, activeColor: Colors.pink, handler: () => _toggleNIBP()),
      'SCOPE': ButtonConfig(defaultOn: false, activeColor: Colors.lime, handler: () => _toggleScope()),
      'BPM-': ButtonConfig(defaultOn: false, activeColor: Colors.red, handler: () => _handleBpmDecrease()),
      'BPM+': ButtonConfig(defaultOn: false, activeColor: Colors.green, handler: () => _handleBpmIncrease()),      
      'SAT-': ButtonConfig(defaultOn: false, activeColor: Colors.red, handler: () => _handleSpO2Decrease()),
      'SAT+': ButtonConfig(defaultOn: false, activeColor: Colors.grey, handler: () => _handleSpO2Increase()),
      'STORE': ButtonConfig(defaultOn: false, activeColor: Colors.green, handler: () => _handleStore()),
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a1a),
        border: Border(top: BorderSide(color: Colors.grey.withOpacity(0.3), width: 0.5)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
        child: Row(children: _buttonConfigs.keys.map((label) => _buildButton(label)).toList()),
      ),
    );
  }

  Widget _buildButton(String label) {
    final config = _buttonConfigs[label]!;
    final bool isToggled = config.isOn;
    final Color activeColor = config.activeColor;

    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2.0),
        child: AspectRatio(
          aspectRatio: 1.0, // Makes buttons square
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(3.0),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isToggled
                    ? [activeColor.withOpacity(0.9), activeColor.withOpacity(0.7)]
                    : [
                        const Color(0xFF2a2a2a), // Normal state
                        const Color(0xFF1a1a1a),
                      ],
              ),
              boxShadow: [
                // Outer shadow (bottom-right)
                BoxShadow(
                  color: isToggled ? activeColor.withOpacity(0.4) : Colors.black.withOpacity(0.6),
                  offset: const Offset(1.5, 1.5),
                  blurRadius: isToggled ? 3.0 : 2.0,
                  spreadRadius: 0,
                ),
                // Inner highlight (top-left)
                BoxShadow(
                  color: isToggled ? activeColor.withOpacity(0.3) : Colors.white.withOpacity(0.1),
                  offset: const Offset(-0.5, -0.5),
                  blurRadius: 1.0,
                  spreadRadius: 0,
                ),
              ],
              border: Border.all(
                color: isToggled ? activeColor.withOpacity(0.8) : Colors.grey.withOpacity(0.3),
                width: isToggled ? 1.0 : 0.5,
              ),
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(3.0),
              child: InkWell(
                onTap: () => _onButtonPressed(label),
                borderRadius: BorderRadius.circular(3.0),
                splashColor: isToggled ? Colors.white.withOpacity(0.3) : Colors.white.withOpacity(0.15),
                highlightColor: isToggled ? Colors.white.withOpacity(0.2) : Colors.white.withOpacity(0.08),
                child: Container(
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(3.0)),
                  alignment: Alignment.center,
                  child: Text(
                    label,
                    style: TextStyle(
                      color: isToggled
                          ? Colors
                                .white
                          : const Color(0xFFDDDDDD),
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.3,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _handleSpO2Increase() {
    _buttonConfigs['RECALL']!.isOn = true;
    widget.onIncreaseSpO2?.call();
    debugPrint('SpO2 increased - Current range: ${widget.currentSpO2Range}');

    // ADD THIS:
    Future.delayed(const Duration(milliseconds: 200), () {
      setState(() {
        _buttonConfigs['RECALL']!.isOn = false;
      });
    });
  }

  void _handleSpO2Decrease() {
    _buttonConfigs['DEFIB']!.isOn = true;
    widget.onDecreaseSpO2?.call();
    debugPrint('SpO2 decreased - Current range: ${widget.currentSpO2Range}');

    // ADD THIS:
    Future.delayed(const Duration(milliseconds: 200), () {
      setState(() {
        _buttonConfigs['DEFIB']!.isOn = false;
      });
    });
  }

  void _onButtonPressed(String buttonName) {
    final config = _buttonConfigs[buttonName]!;
    config.handler();

    setState(() {
      
    });

    debugPrint('Monitor button pressed: $buttonName (${config.isOn ? 'ON' : 'OFF'})');
  }

  // Button handlers - customize these for your needs
  void _toggleMenu() {
    _buttonConfigs['MENU']!.toggle();
    // TODO: Open/close main menu
  }

  void _toggleAlarms() {
    _buttonConfigs['ALARMS']!.toggle();
    settings.alarmsEnabled = _buttonConfigs['ALARMS']!.isOn;
    debugPrint('Alarms ${settings.alarmsEnabled ? 'enabled' : 'disabled'}');
  }

  void _toggleLeads() {
    _buttonConfigs['LEADS']!.toggle();
    // TODO: Toggle ECG lead display mode
  }

  void _handlePrint() {
    _buttonConfigs['PRINT']!.isOn = true; // Momentarily show as active
    // TODO: Print current waveforms
    Future.delayed(const Duration(milliseconds: 500), () {
      setState(() {
        _buttonConfigs['PRINT']!.isOn = false;
      });
    });
  }

  void _toggleFreeze() {
    _buttonConfigs['FREEZE']!.toggle();
    // TODO: Freeze/unfreeze all waveforms
  }

  void _toggleTrends() {
    _buttonConfigs['TRENDS']!.toggle();
    // TODO: Show/hide trend graphs
  }

  void _toggleSetup() {
    _buttonConfigs['SETUP']!.toggle();
    if (_buttonConfigs['SETUP']!.isOn && widget.currentBpmRange != null) {
      debugPrint('SETUP active - Current BPM range: ${widget.currentBpmRange}');
    }
    // TODO: Open/close setup menu
  }

  void _toggleEvents() {
    _buttonConfigs['EVENTS']!.toggle();
    settings.playBeats = !settings.playBeats;
  }

  void _toggle12Lead() {
    _buttonConfigs['12-LEAD']!.toggle();
    // TODO: Switch to/from 12-lead ECG view
  }

  void _toggleNIBP() {
    _buttonConfigs['NIBP']!.toggle();
    if (_buttonConfigs['NIBP']!.isOn) {
      // TODO: Start blood pressure measurement
      // Auto-turn off after measurement
      Future.delayed(const Duration(seconds: 3), () {
        setState(() {
          _buttonConfigs['NIBP']!.isOn = false;
        });
      });
    }
  }

  void _toggleScope() {
    _buttonConfigs['SCOPE']!.toggle();
    // TODO: Open/close waveform scope settings
  }

  void _handleBpmIncrease() {
    _buttonConfigs['BPM+']!.isOn = true; // Momentarily show as active
    widget.onIncreaseBpm?.call();
    debugPrint('BPM increased - Current range: ${widget.currentBpmRange}');

    Future.delayed(const Duration(milliseconds: 200), () {
      setState(() {
        _buttonConfigs['BPM+']!.isOn = false;
      });
    });
  }

  void _handleBpmDecrease() {
    _buttonConfigs['BPM-']!.isOn = true; // Momentarily show as active
    widget.onDecreaseBpm?.call();
    debugPrint('BPM decreased - Current range: ${widget.currentBpmRange}');

    Future.delayed(const Duration(milliseconds: 200), () {
      setState(() {
        _buttonConfigs['BPM-']!.isOn = false;
      });
    });
  }

  void _toggleDefib() {
    _buttonConfigs['DEFIB']!.toggle();
    // TODO: Enable/disable defibrillator mode (DANGER!)
  }

  void _handleRecall() {
    _buttonConfigs['RECALL']!.isOn = true; // Momentarily show as active
    // TODO: Recall previous settings
    Future.delayed(const Duration(milliseconds: 300), () {
      setState(() {
        _buttonConfigs['RECALL']!.isOn = false;
      });
    });
  }

  void _handleStore() {
    _buttonConfigs['STORE']!.isOn = true; // Momentarily show as active
    // TODO: Store current settings
    Future.delayed(const Duration(milliseconds: 300), () {
      setState(() {
        _buttonConfigs['STORE']!.isOn = false;
      });
    });
  }
}

class ButtonConfig {
  bool isOn;
  final Color activeColor;
  final VoidCallback handler;

  ButtonConfig({required bool defaultOn, required this.activeColor, required this.handler}) : isOn = defaultOn;

  void toggle() {
    isOn = !isOn;
  }
}
