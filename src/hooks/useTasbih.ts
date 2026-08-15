import { useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface DhikrPreset {
    id: string;
    arabic: string;
    transliteration: string;
    translation: string;
    defaultTarget: number | null; // null = unlimited
}

export const DHIKR_PRESETS: DhikrPreset[] = [
    {
        id: 'tasbih',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhanallah',
        translation: 'Maha Suci Allah',
        defaultTarget: 33,
    },
    {
        id: 'tahmid',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'Segala puji bagi Allah',
        defaultTarget: 33,
    },
    {
        id: 'takbir',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah Maha Besar',
        defaultTarget: 33,
    },
    {
        id: 'tahlil',
        arabic: 'لَا إِلٰهَ إِلَّا اللَّهُ',
        transliteration: 'Laa ilaaha illallah',
        translation: 'Tiada Tuhan selain Allah',
        defaultTarget: 100,
    },
    {
        id: 'istighfar',
        arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ',
        transliteration: 'Astaghfirullahal \'Azhim',
        translation: 'Aku memohon ampun kepada Allah Yang Maha Agung',
        defaultTarget: 100,
    },
    {
        id: 'shalawat',
        arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ',
        transliteration: 'Allahumma Sholli \'ala Sayyidina Muhammad',
        translation: 'Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad',
        defaultTarget: 100,
    },
    {
        id: 'hauqalah',
        arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        transliteration: 'Laa hawla wa laa quwwata illa billah',
        translation: 'Tiada daya dan kekuatan kecuali dengan pertolongan Allah',
        defaultTarget: 100,
    },
    {
        id: 'custom',
        arabic: 'ذِكْرٌ مُطْلَقٌ',
        transliteration: 'Dzikir Bebas / Kustom',
        translation: 'Ingat kepada Allah di setiap hembusan nafas',
        defaultTarget: null,
    },
];

// Synthesizer click sound using Web Audio API
function playHapticSound(type: 'tap' | 'target') {
    if (typeof window === 'undefined') return;
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        
        if (type === 'tap') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } else {
            // Target reached melodic chime
            [523.25, 659.25, 783.99].forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
                
                gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.25);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + index * 0.08);
                osc.stop(ctx.currentTime + index * 0.08 + 0.25);
            });
        }
    } catch {
        // AudioContext might be blocked until user interacts, ignore
    }
}

export function useTasbih() {
    // Persistent states
    const [count, setCount] = useLocalStorage<number>('quran_suite_tasbih_count', 0);
    const [target, setTarget] = useLocalStorage<number | null>('quran_suite_tasbih_target', 33);
    const [totalLaps, setTotalLaps] = useLocalStorage<number>('quran_suite_tasbih_laps', 0);
    const [selectedDhikrId, setSelectedDhikrId] = useLocalStorage<string>('quran_suite_tasbih_dhikr_id', 'tasbih');
    const [hapticEnabled, setHapticEnabled] = useLocalStorage<boolean>('quran_suite_tasbih_haptic', true);
    const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>('quran_suite_tasbih_sound', true);

    // Ephemeral UI states
    const [isTargetReachedAnim, setIsTargetReachedAnim] = useState(false);
    const animTimerRef = useRef<number | null>(null);

    // Find current dhikr info
    const currentDhikr = DHIKR_PRESETS.find(d => d.id === selectedDhikrId) || DHIKR_PRESETS[0];

    // Trigger haptic vibration safely
    const triggerHaptic = useCallback((pattern: number | number[]) => {
        if (!hapticEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;
        try {
            navigator.vibrate(pattern);
        } catch {
            // Ignore vibration error on unsupported platforms
        }
    }, [hapticEnabled]);

    // Handle Tap / Increment
    const increment = useCallback(() => {
        setCount(prev => {
            const nextCount = prev + 1;
            
            // Check if target is set and reached
            if (target !== null && target > 0) {
                if (nextCount % target === 0) {
                    // Target reached!
                    setTotalLaps(l => l + 1);
                    triggerHaptic([100, 60, 100, 60, 150]);
                    if (soundEnabled) playHapticSound('target');

                    // Trigger screen glow animation
                    setIsTargetReachedAnim(true);
                    if (animTimerRef.current) clearTimeout(animTimerRef.current);
                    animTimerRef.current = window.setTimeout(() => {
                        setIsTargetReachedAnim(false);
                    }, 800);

                    return nextCount;
                }
            }

            // Normal tap
            triggerHaptic(40);
            if (soundEnabled) playHapticSound('tap');

            return nextCount;
        });
    }, [target, soundEnabled, triggerHaptic, setCount, setTotalLaps]);

    // Handle Decrement (Undo accidental tap)
    const decrement = useCallback(() => {
        setCount(prev => {
            if (prev <= 0) return 0;
            triggerHaptic(25);
            return prev - 1;
        });
    }, [setCount, triggerHaptic]);

    // Reset current count
    const reset = useCallback((resetLaps = false) => {
        setCount(0);
        if (resetLaps) {
            setTotalLaps(0);
        }
        triggerHaptic([50, 50]);
    }, [setCount, setTotalLaps, triggerHaptic]);

    // Select dhikr preset
    const selectDhikr = useCallback((dhikrId: string) => {
        const preset = DHIKR_PRESETS.find(d => d.id === dhikrId);
        if (preset) {
            setSelectedDhikrId(preset.id);
            if (preset.defaultTarget !== undefined) {
                setTarget(preset.defaultTarget);
            }
            setCount(0);
        }
    }, [setSelectedDhikrId, setTarget, setCount]);

    // Custom Target setter
    const updateTarget = useCallback((newTarget: number | null) => {
        setTarget(newTarget);
    }, [setTarget]);

    return {
        count,
        target,
        totalLaps,
        currentDhikr,
        selectedDhikrId,
        hapticEnabled,
        soundEnabled,
        isTargetReachedAnim,
        increment,
        decrement,
        reset,
        selectDhikr,
        setTarget: updateTarget,
        setHapticEnabled,
        setSoundEnabled,
    };
}
