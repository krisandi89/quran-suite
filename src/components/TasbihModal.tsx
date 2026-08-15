/**
 * Tasbih Digital Modal
 * Mobile-first interactive tasbih counter with massive tap area,
 * haptic vibration, circular progress indicator, and persistent state.
 */
import { useState, useRef, useEffect, useCallback, useId } from 'react';
import {
    X,
    RotateCcw,
    Minus,
    Volume2,
    VolumeX,
    Vibrate,
    VibrateOff,
    Sparkles,
    Settings,
    Layers,
    Check,
} from 'lucide-react';
import { useTasbih, DHIKR_PRESETS } from '@/hooks';

interface TasbihModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Ripple {
    id: number;
    x: number;
    y: number;
    size: number;
}

export function TasbihModal({ isOpen, onClose }: TasbihModalProps) {
    const {
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
        setTarget,
        setHapticEnabled,
        setSoundEnabled,
    } = useTasbih();

    // Local UI state
    const [isClosing, setIsClosing] = useState(false);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const [showPresetsMenu, setShowPresetsMenu] = useState(false);
    const [showCustomTargetModal, setShowCustomTargetModal] = useState(false);
    const [customTargetInput, setCustomTargetInput] = useState('');
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

    // Hold-to-reset button state
    const [resetProgress, setResetProgress] = useState(0);
    const resetHoldTimerRef = useRef<number | null>(null);
    const resetIntervalRef = useRef<number | null>(null);
    const lastTapTimeRef = useRef<number>(0);

    // Unique gradient ID for SVG to prevent collisions
    const gradientId = useId();

    // Close handler with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setShowPresetsMenu(false);
            setShowCustomTargetModal(false);
            setShowResetConfirmModal(false);
            onClose();
        }, 200);
    }, [onClose]);

    // Keyboard support: Space / ArrowUp to count, ArrowDown to minus, R to reset, Esc to close
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (showCustomTargetModal || showResetConfirmModal) return;

            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
                e.preventDefault();
                increment();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                decrement();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, increment, decrement, handleClose, showCustomTargetModal, showResetConfirmModal]);

    // Handle Massive Tap Area Click & Ripple Generation (Unified PointerEvent)
    const handleTapArea = (e: React.PointerEvent<HTMLDivElement>) => {
        // Prevent action if clicked on control buttons or non-primary mouse button
        if ((e.target as HTMLElement).closest('[data-prevent-tap="true"]') || (e.button !== 0 && e.pointerType === 'mouse')) {
            return;
        }

        // Prevent double trigger within 120ms (prevents touch + simulated mouse event duplicates)
        const now = Date.now();
        if (now - lastTapTimeRef.current < 120) {
            return;
        }
        lastTapTimeRef.current = now;

        const clientX = e.clientX;
        const clientY = e.clientY;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 1.4;

        const newRipple: Ripple = {
            id: Date.now() + Math.random(),
            x,
            y,
            size,
        };

        setRipples(prev => [...prev.slice(-4), newRipple]);

        // Trigger increment exactly once
        increment();

        // Visual press bounce
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 120);
    };

    // Clean up expired ripples
    const removeRipple = (id: number) => {
        setRipples(prev => prev.filter(r => r.id !== id));
    };

    // Hold to reset handlers
    const startResetHold = () => {
        setResetProgress(0);
        const startTime = Date.now();
        const duration = 1000; // 1 second hold

        resetIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / duration) * 100);
            setResetProgress(progress);

            if (progress >= 100) {
                if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
                if (resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current);
                reset(false);
                setResetProgress(0);
            }
        }, 16);
    };

    const cancelResetHold = () => {
        if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
        if (resetHoldTimerRef.current) clearTimeout(resetHoldTimerRef.current);
        setResetProgress(0);
    };

    // Save custom target
    const handleSaveCustomTarget = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInt(customTargetInput, 10);
        if (!isNaN(parsed) && parsed > 0) {
            setTarget(parsed);
            setShowCustomTargetModal(false);
            setCustomTargetInput('');
        }
    };

    if (!isOpen && !isClosing) return null;

    // Calculate circular progress
    const radius = 120;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    
    let progressPercent = 0;
    if (target && target > 0) {
        // Current cycle progress (0 to 100%)
        const currentInCycle = count % target;
        progressPercent = count === 0 ? 0 : currentInCycle === 0 ? 100 : (currentInCycle / target) * 100;
    }

    const strokeDashoffset = target
        ? circumference - (progressPercent / 100) * circumference
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Main Tasbih Container (Full Screen on Mobile, Card on Desktop) */}
            <div
                className={`
                    relative w-full h-full md:max-w-lg md:h-[92vh] md:max-h-[850px] md:rounded-3xl
                    bg-surface-50 border-0 md:border md:border-surface-200 shadow-2xl shadow-black/80
                    flex flex-col justify-between overflow-hidden touch-no-delay
                    pt-safe pb-safe pl-safe pr-safe
                    ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    ${isTargetReachedAnim ? 'animate-target-flash ring-4 ring-gold/70' : ''}
                `}
            >
                {/* 1. TOP BAR / HEADER */}
                <div
                    data-prevent-tap="true"
                    className="flex items-center justify-between px-5 pt-4 pb-2 z-20"
                >
                    {/* Dhikr Selector Button */}
                    <button
                        onClick={() => setShowPresetsMenu(prev => !prev)}
                        className="
                            flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-surface-100/90 hover:bg-surface-200/90 text-gray-200
                            border border-surface-200/60 text-xs font-medium
                            transition-all active:scale-95 shadow-sm
                        "
                    >
                        <Sparkles size={14} className="text-accent" />
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                            {currentDhikr.transliteration}
                        </span>
                        <span className="text-[10px] text-gray-400">▼</span>
                    </button>

                    {/* Quick Controls: Sound, Haptic, Close */}
                    <div className="flex items-center gap-1">
                        {/* Audio Toggle */}
                        <button
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className={`
                                p-2 rounded-full transition-colors active:scale-90
                                ${soundEnabled ? 'text-accent bg-surface-100 hover:bg-surface-200' : 'text-gray-500 hover:text-gray-300 bg-transparent'}
                            `}
                            title={soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
                        >
                            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>

                        {/* Vibration Toggle */}
                        <button
                            onClick={() => setHapticEnabled(prev => !prev)}
                            className={`
                                p-2 rounded-full transition-colors active:scale-90
                                ${hapticEnabled ? 'text-accent bg-surface-100 hover:bg-surface-200' : 'text-gray-500 hover:text-gray-300 bg-transparent'}
                            `}
                            title={hapticEnabled ? 'Getaran Aktif' : 'Getaran Mati'}
                        >
                            {hapticEnabled ? <Vibrate size={18} /> : <VibrateOff size={18} />}
                        </button>

                        {/* Close Modal */}
                        <button
                            onClick={handleClose}
                            className="p-2 ml-1 text-gray-400 hover:text-white rounded-full hover:bg-surface-100 transition-colors active:scale-90"
                            title="Tutup Tasbih"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. DHIKR ARABIC & MEANING SECTION */}
                <div
                    data-prevent-tap="true"
                    className="px-6 py-2 text-center z-10 cursor-pointer"
                    onClick={() => setShowPresetsMenu(true)}
                >
                    <div className="text-2xl sm:text-3xl text-gold font-arabic mb-1 tracking-wide leading-relaxed filter drop-shadow-sm">
                        {currentDhikr.arabic}
                    </div>
                    <div className="text-sm text-gray-300 font-medium">
                        {currentDhikr.transliteration}
                    </div>
                    <div className="text-xs text-gray-500 italic line-clamp-1 max-w-xs mx-auto mt-0.5">
                        "{currentDhikr.translation}"
                    </div>
                </div>

                {/* 3. MASSIVE INTERACTIVE TAP AREA (The whole middle screen) */}
                <div
                    className="
                        relative flex-1 flex flex-col items-center justify-center
                        cursor-pointer overflow-hidden my-auto w-full touch-manipulation
                    "
                    onPointerDown={handleTapArea}
                >
                    {/* Ripple Elements */}
                    {ripples.map(ripple => (
                        <span
                            key={ripple.id}
                            onAnimationEnd={() => removeRipple(ripple.id)}
                            style={{
                                top: ripple.y,
                                left: ripple.x,
                                width: ripple.size,
                                height: ripple.size,
                            }}
                            className="
                                absolute rounded-full bg-accent/25 pointer-events-none
                                animate-tasbih-ripple border border-accent/40
                            "
                        />
                    ))}

                    {/* Circular Progress & Tap Hub */}
                    <div className="relative flex items-center justify-center p-6">
                        {/* Background Aura */}
                        <div
                            className={`
                                absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full
                                bg-gradient-to-tr from-accent/15 via-gold/10 to-transparent
                                blur-2xl pointer-events-none transition-all duration-300
                                ${isPressed ? 'scale-110 opacity-80' : 'scale-100 opacity-40'}
                            `}
                        />

                        {/* Circular Progress SVG */}
                        <svg
                            className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90 transform pointer-events-none"
                            viewBox="0 0 280 280"
                        >
                            <defs>
                                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#d4af37" />
                                </linearGradient>
                            </defs>

                            {/* Background Track */}
                            <circle
                                cx="140"
                                cy="140"
                                r={radius}
                                fill="transparent"
                                stroke="#1f2937"
                                strokeWidth={strokeWidth}
                                strokeDasharray={target ? undefined : '6 8'}
                                className={!target ? 'animate-spin-slow' : ''}
                            />

                            {/* Progress Arc */}
                            {target ? (
                                <circle
                                    cx="140"
                                    cy="140"
                                    r={radius}
                                    fill="transparent"
                                    stroke={`url(#${gradientId})`}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-200 ease-out"
                                />
                            ) : (
                                <circle
                                    cx="140"
                                    cy="140"
                                    r={radius}
                                    fill="transparent"
                                    stroke="#10b981"
                                    strokeWidth={strokeWidth - 4}
                                    strokeOpacity="0.4"
                                    className="animate-gentle-pulse"
                                />
                            )}
                        </svg>

                        {/* Central Counter Display */}
                        <div
                            className={`
                                absolute inset-0 flex flex-col items-center justify-center
                                pointer-events-none transition-transform duration-100
                                ${isPressed ? 'scale-95' : 'scale-100'}
                            `}
                        >
                            {/* Target & Lap Tag */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1 font-medium tracking-wide">
                                {totalLaps > 0 && (
                                    <span className="flex items-center gap-1 text-gold bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20">
                                        <Layers size={11} />
                                        Putaran {totalLaps}
                                    </span>
                                )}
                                <span>
                                    Target: {target !== null ? target : '∞ (Bebas)'}
                                </span>
                            </div>

                            {/* Main Big Number Counter */}
                            <div className="text-6xl sm:text-7xl font-bold tracking-tight text-white font-sans drop-shadow-md">
                                {count}
                            </div>

                            {/* Tap Instruction Prompt */}
                            <div className="text-xs text-accent-light/80 mt-2 font-medium tracking-wider uppercase animate-pulse">
                                Ketuk Layar
                            </div>
                        </div>
                    </div>

                    {/* Subtle reminder */}
                    <div className="text-[11px] text-gray-500 tracking-wide mt-2 text-center pointer-events-none">
                        Ketuk di mana saja di area ini
                    </div>
                </div>

                {/* 4. TARGET SELECTOR PILLS */}
                <div
                    data-prevent-tap="true"
                    className="px-5 py-2 z-10"
                >
                    <div className="text-[11px] font-medium text-gray-400 mb-2 flex items-center justify-between">
                        <span>Pilih Target Hitungan:</span>
                        {target && (
                            <span className="text-accent">
                                {Math.round(progressPercent)}% Tercapai
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {([33, 100, 1000] as const).map(presetValue => (
                            <button
                                key={presetValue}
                                onClick={() => setTarget(presetValue)}
                                className={`
                                    py-2 px-1 rounded-xl text-xs font-semibold border transition-all active:scale-95
                                    ${target === presetValue
                                        ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25'
                                        : 'bg-surface-100 text-gray-300 border-surface-200 hover:border-accent/40 hover:bg-surface-200'
                                    }
                                `}
                            >
                                {presetValue}
                            </button>
                        ))}

                        {/* Custom Target Pill */}
                        <button
                            onClick={() => {
                                setCustomTargetInput(target && ![33, 100, 1000].includes(target) ? String(target) : '');
                                setShowCustomTargetModal(true);
                            }}
                            className={`
                                py-2 px-1 rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center justify-center gap-1
                                ${target && ![33, 100, 1000].includes(target)
                                    ? 'bg-gold text-surface-50 border-gold shadow-lg shadow-gold/25 font-bold'
                                    : 'bg-surface-100 text-gray-300 border-surface-200 hover:border-gold/40 hover:bg-surface-200'
                                }
                            `}
                        >
                            {target && ![33, 100, 1000].includes(target) ? target : 'Kustom'}
                        </button>

                        {/* Unlimited / Tanpa Batas */}
                        <button
                            onClick={() => setTarget(null)}
                            className={`
                                py-2 px-1 rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center justify-center
                                ${target === null
                                    ? 'bg-surface-200 text-white border-gray-500 shadow-md'
                                    : 'bg-surface-100 text-gray-400 border-surface-200 hover:border-gray-500 hover:bg-surface-200'
                                }
                            `}
                        >
                            ∞ Bebas
                        </button>
                    </div>
                </div>

                {/* 5. BOTTOM ACTION TOOLBAR (Protected Reset & Decrement) */}
                <div
                    data-prevent-tap="true"
                    className="flex items-center justify-between px-6 py-4 border-t border-surface-200/60 bg-surface-100/40 z-10"
                >
                    {/* Hold-to-Reset Button with safety fill animation */}
                    <div className="relative">
                        <button
                            onPointerDown={startResetHold}
                            onPointerUp={cancelResetHold}
                            onPointerLeave={cancelResetHold}
                            onPointerCancel={cancelResetHold}
                            onClick={() => {
                                if (resetProgress < 100 && count > 0) {
                                    setShowResetConfirmModal(true);
                                }
                            }}
                            className="
                                relative group overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-xl
                                bg-surface-200 text-gray-300 hover:text-white border border-surface-300
                                text-xs font-medium transition-all active:scale-95 shadow-sm
                            "
                        >
                            {/* Filling Progress Indicator Bar */}
                            <div
                                style={{ width: `${resetProgress}%` }}
                                className="absolute left-0 top-0 bottom-0 bg-red-600/60 transition-all duration-75 pointer-events-none"
                            />
                            <RotateCcw size={15} className={`text-red-400 transition-transform ${resetProgress > 0 ? 'rotate-180' : ''}`} />
                            <span className="relative z-10">
                                {resetProgress > 0 ? 'Tahan...' : 'Reset'}
                            </span>
                        </button>
                    </div>

                    {/* Quick Tip / Hint */}
                    <div className="text-[11px] text-gray-500 hidden sm:block">
                        Tahan 1 detik untuk reset
                    </div>

                    {/* Minus / Decrement Button (Undo accidental tap) */}
                    <button
                        onClick={decrement}
                        disabled={count <= 0}
                        className={`
                            flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium
                            border transition-all active:scale-95
                            ${count > 0
                                ? 'bg-surface-200 hover:bg-surface-300 text-gray-200 border-surface-300'
                                : 'bg-surface-100 text-gray-600 border-surface-200/50 cursor-not-allowed opacity-50'
                            }
                        `}
                        title="Kurangi 1 (Undo)"
                    >
                        <Minus size={15} />
                        <span>Kurangi 1</span>
                    </button>
                </div>
            </div>

            {/* =========================================================
               MODAL: PRESETS DZIKIR SELECTOR DRAWER
               ========================================================= */}
            {showPresetsMenu && (
                <div
                    className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
                    onClick={() => setShowPresetsMenu(false)}
                >
                    <div
                        className="w-full sm:max-w-md bg-surface-50 border border-surface-200 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl spotlight-enter max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                            <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                <Sparkles size={18} className="text-gold" />
                                Pilihan Bacaan Dzikir
                            </h3>
                            <button
                                onClick={() => setShowPresetsMenu(false)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-full"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto py-2 space-y-2 flex-1 mt-2">
                            {DHIKR_PRESETS.map(preset => {
                                const isSelected = selectedDhikrId === preset.id;
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => {
                                            selectDhikr(preset.id);
                                            setShowPresetsMenu(false);
                                        }}
                                        className={`
                                            w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between
                                            ${isSelected
                                                ? 'bg-accent/15 border-accent text-white shadow-sm'
                                                : 'bg-surface-100 hover:bg-surface-200 border-surface-200 text-gray-300'
                                            }
                                        `}
                                    >
                                        <div className="flex-1 pr-3">
                                            <div className="text-right text-lg text-gold font-arabic mb-1">
                                                {preset.arabic}
                                            </div>
                                            <div className="font-semibold text-sm text-gray-100">
                                                {preset.transliteration}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                                {preset.translation}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0">
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               MODAL: CUSTOM TARGET INPUT
               ========================================================= */}
            {showCustomTargetModal && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowCustomTargetModal(false)}
                >
                    <div
                        className="w-full max-w-xs bg-surface-50 border border-surface-200 rounded-2xl p-5 shadow-2xl spotlight-enter"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                            <Settings size={18} className="text-gold" />
                            Target Kustom
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Masukkan jumlah target hitungan dzikir yang Anda inginkan:
                        </p>

                        <form onSubmit={handleSaveCustomTarget}>
                            <input
                                type="number"
                                min="1"
                                max="99999"
                                value={customTargetInput}
                                onChange={e => setCustomTargetInput(e.target.value)}
                                placeholder="Contoh: 40, 70, 500"
                                autoFocus
                                className="
                                    w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-200
                                    text-white text-lg font-bold placeholder-gray-500 focus:outline-none focus:border-accent
                                    text-center mb-4
                                "
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomTargetModal(false)}
                                    className="flex-1 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-gray-400 text-xs font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!customTargetInput || parseInt(customTargetInput, 10) <= 0}
                                    className="flex-1 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-semibold disabled:opacity-50"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================
               MODAL: RESET CONFIRMATION
               ========================================================= */}
            {showResetConfirmModal && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowResetConfirmModal(false)}
                >
                    <div
                        className="w-full max-w-xs bg-surface-50 border border-surface-200 rounded-2xl p-5 shadow-2xl spotlight-enter text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-3">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-base font-semibold text-white mb-1">
                            Reset Hitungan?
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Hitungan saat ini ({count}) akan dikembalikan ke angka 0.
                        </p>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    reset(false);
                                    setShowResetConfirmModal(false);
                                }}
                                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md active:scale-95"
                            >
                                Ya, Reset Hitungan
                            </button>
                            <button
                                onClick={() => {
                                    reset(true);
                                    setShowResetConfirmModal(false);
                                }}
                                className="w-full py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-gray-300 text-xs font-medium"
                            >
                                Reset Hitungan & Putaran
                            </button>
                            <button
                                onClick={() => setShowResetConfirmModal(false)}
                                className="w-full py-2 text-gray-400 hover:text-white text-xs"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
