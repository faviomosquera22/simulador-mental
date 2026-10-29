"""Create local illustrative audio beds and Spanish case quotations.
Requires numpy; macOS say/afconvert are used only when --voices is supplied.
No recordings of patients or third-party sound samples are used.
"""
from pathlib import Path
import json
import subprocess
import sys
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/brain-explorer/audio'
OUT.mkdir(exist_ok=True)
SR = 24000
DURATION = 12
N = SR * DURATION
t = np.arange(N) / SR
rng = np.random.default_rng(2145)

def filtered_noise(low, high):
    noise = rng.normal(0, 1, N)
    spectrum = np.fft.rfft(noise)
    freq = np.fft.rfftfreq(N, 1 / SR)
    spectrum *= np.clip((freq - low) / max(low, 40), 0, 1) * np.clip((high - freq) / 200, 0, 1)
    result = np.fft.irfft(spectrum, N)
    return result / max(np.std(result), 1e-6)

AIR = filtered_noise(200, 2200)
RAIN = filtered_noise(400, 3500)
RUMBLE = filtered_noise(30, 220)

def insert(signal, at, sound):
    start = int(at * SR)
    if start < 0 or start >= N:
        return
    length = min(N - start, len(sound))
    signal[start:start + length] += sound[:length]

def heart(rate):
    result = np.zeros(N)
    beat_t = np.arange(int(SR * .22)) / SR
    for at in np.arange(.18, DURATION, 60 / rate):
        for delay, strength in [(0, 1), (.16, .68)]:
            envelope = (1 - np.exp(-beat_t * 350)) * np.exp(-beat_t * 25)
            sound = np.sin(2 * np.pi * (64 * beat_t + 1.8 * (1 - np.exp(-beat_t * 20)))) * envelope
            sound += .16 * np.sin(2 * np.pi * 115 * beat_t) * envelope
            insert(result, at + delay, strength * sound)
    return result

def breathing(rate):
    cycle = (t * rate / 60) % 1
    inhale = np.where(cycle < .42, np.sin(np.pi * np.minimum(cycle / .42, 1)) ** 1.6, 0)
    exhale = np.where((cycle > .50) & (cycle < .95), np.sin(np.pi * np.clip((cycle - .5) / .45, 0, 1)) ** 1.8, 0)
    return AIR * (.55 * inhale + .75 * exhale)

manifest = []
for case in ['depression', 'anxiety', 'claustrophobia']:
    for phase in ['context', 'experience', 'support']:
        peak = phase == 'experience'
        if case == 'depression':
            signal = RAIN * .038 + RUMBLE * .025
            # An illustrative muted environment with sparse, neutral piano-like notes.
            for i, at in enumerate([.4, 3.5, 6.5, 9.5]):
                note_t = np.arange(SR * 2) / SR
                frequency = [196, 220, 164.81, 196][i]
                note = sum(np.sin(2 * np.pi * frequency * harmonic * note_t) / harmonic ** 2 for harmonic in [1, 2, 3])
                insert(signal, at, note * (1 - np.exp(-note_t * 60)) * np.exp(-note_t * 2.2) * .11)
            if peak:
                tick_t = np.arange(int(SR * .04)) / SR
                for at in np.arange(1, 12, 1): insert(signal, at, .065 * np.sin(2 * np.pi * 1050 * tick_t) * np.exp(-tick_t * 140))
            signal += breathing(10) * .018
        else:
            rate = (108 if case == 'anxiety' else 112) if peak else (76 if phase == 'support' else 84)
            signal = heart(rate) * .46 + breathing(24 if peak else 15) * (.075 if peak else .05)
            if case == 'anxiety':
                signal += RAIN * .012
                tick_t = np.arange(int(SR * .05)) / SR
                for at in np.arange(.7, 12, .7 if peak else 1.2): insert(signal, at, .042 * np.sin(2 * np.pi * 850 * tick_t) * np.exp(-tick_t * 120))
            else:
                # Elevator motor, ventilation and a softly sliding door, without a startling impact.
                signal += .045 * np.sin(2 * np.pi * 55 * t) + .02 * np.sin(2 * np.pi * 110 * t) + RUMBLE * .035
                slide = np.sin(np.pi * np.clip((t - .4) / 2.2, 0, 1)) ** 2
                slide[t > 2.6] = 0
                signal += AIR * slide * .08
                motor = .6 + .4 * np.sin(2 * np.pi * t / 12) ** 2
                signal += .018 * np.sin(2 * np.pi * 165 * t) * motor
        # Loop edge fades and a conservative peak cap. No loudness jumps are used.
        fade = np.minimum(np.minimum(t / .12, (DURATION - t) / .12), 1)
        signal *= fade
        signal = np.column_stack([signal, .93 * signal + .025 * np.roll(RAIN, 200) * fade])
        max_abs = np.max(np.abs(signal))
        rms = np.sqrt(np.mean(signal ** 2))
        signal *= min(.105 / max(rms, 1e-6), .78 / max(max_abs, 1e-6))
        pcm = (np.clip(signal, -.95, .95) * 32767).astype('<i2')
        path = OUT / f'{case}-{phase}.wav'
        with wave.open(str(path), 'wb') as wav:
            wav.setnchannels(2); wav.setsampwidth(2); wav.setframerate(SR); wav.writeframes(pcm.tobytes())
        manifest.append({'file': path.name, 'duration': DURATION, 'rms': round(float(np.sqrt(np.mean(signal ** 2))), 4), 'peak': round(float(np.max(np.abs(signal))), 4)})

if '--voices' in sys.argv:
    cases = json.loads(Path('/tmp/brain-audio-cases.json').read_text())
    for case in cases:
        for phase, data in case['phases'].items():
            path = OUT / f'{case["id"]}-{phase}-voice.wav'
            aiff = Path('/tmp') / f'brain-{case["id"]}-{phase}-voice.aiff'
            voice = 'Paulina' if case['id'] == 'depression' else 'Eddy (Español (México))'
            subprocess.run(['/usr/bin/say', '-v', voice, '-r', '145' if case['id'] == 'depression' else '165', '-o', str(aiff), data['quote']], check=True)
            subprocess.run(['/usr/bin/afconvert', str(aiff), str(path), '-f', 'WAVE', '-d', 'LEI16@24000'], check=True)
            with wave.open(str(path)) as wav:
                assert wav.getnframes() > SR, f'Voice generation failed: {path}'
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Generated {len(manifest)} ambience tracks in {OUT}')
