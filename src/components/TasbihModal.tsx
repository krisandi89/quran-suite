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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Main Tasbih Container (Full Screen on Mobile, Card on Desktop) */}
            <div
                className={`
                    relative w-full h-full md:max-w-lg md:h-[92vh] md:max-h-[850px] md:rounded-3xl
                    bg-white border-0 md:border md:border-[#E6DFD3] shadow-2xl
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
                            flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            bg-gray-100 hover:bg-gray-200 text-gray-800
                            border border-gray-200 text-xs font-semibold
                            transition-all active:scale-95 shadow-xs
                        "
                    >
                        <Sparkles size={14} className="text-emerald-600" />
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
                                ${soundEnabled ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 hover:text-gray-600 bg-transparent'}
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
                                ${hapticEnabled ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 hover:text-gray-600 bg-transparent'}
                            `}
                            title={hapticEnabled ? 'Getaran Aktif' : 'Getaran Mati'}
                        >
                            {hapticEnabled ? <Vibrate size={18} /> : <VibrateOff size={18} />}
                        </button>

                        {/* Close Modal */}
                        <button
                            onClick={handleClose}
                            className="p-2 ml-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors active:scale-90"
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
                    <div className="text-2xl sm:text-3xl text-amber-700 font-arabic mb-1 tracking-wide leading-relaxed filter drop-shadow-sm">
                        {currentDhikr.arabic}
                    </div>
                    <div className="text-sm text-gray-900 font-bold">
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
                                absolute rounded-full bg-emerald-500/20 pointer-events-none
                                animate-tasbih-ripple border border-emerald-500/30
                            "
                        />
                    ))}

                    {/* Circular Progress & Tap Hub */}
                    <div className="relative flex items-center justify-center p-6">
                        {/* Background Aura */}
                        <div
                            className={`
                                absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full
                                bg-gradient-to-tr from-emerald-500/10 via-amber-500/10 to-transparent
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
                                    <stop offset="0%" stopColor="#059669" />
                                    <stop offset="100%" stopColor="#d97706" />
                                </linearGradient>
                            </defs>

                            {/* Background Track */}
                            <circle
                                cx="140"
                                cy="140"
                                r={radius}
                                fill="transparent"
                                stroke="#E6DFD3"
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
                                    stroke="#059669"
                                    strokeWidth={strokeWidth - 4}
                                    strokeOpacity="0.5"
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
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 font-medium tracking-wide">
                                {totalLaps > 0 && (
                                    <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                                        <Layers size={11} />
                                        Putaran {totalLaps}
                                    </span>
                                )}
                                <span>
                                    Target: {target !== null ? target : '∞ (Bebas)'}
                                </span>
                            </div>

                            {/* Main Big Number Counter */}
                            <div className="text-6xl sm:text-7xl font-bold tracking-tight text-gray-900 font-sans drop-shadow-sm">
                                {count}
                            </div>

                            {/* Tap Instruction Prompt */}
                            <div className="text-xs text-emerald-700 mt-2 font-semibold tracking-wider uppercase animate-pulse">
                                Ketuk Layar
                            </div>
                        </div>
                    </div>

                    {/* Subtle reminder */}
                    <div className="text-[11px] text-gray-400 tracking-wide mt-2 text-center pointer-events-none">
                        Ketuk di mana saja di area ini
                    </div>
                </div>

                {/* 4. TARGET SELECTOR PILLS */}
                <div
                    data-prevent-tap="true"
                    className="px-5 py-2 z-10"
                >
                    <div className="text-[11px] font-medium text-gray-500 mb-2 flex items-center justify-between">
                        <span>Pilih Target Hitungan:</span>
                        {target && (
                            <span className="text-emerald-700 font-semibold">
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
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold'
                                        : 'bg-[#FAF8F5] text-gray-700 border-[#E6DFD3] hover:border-emerald-500/50 hover:bg-white'
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
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-md font-bold'
                                    : 'bg-[#FAF8F5] text-gray-700 border-[#E6DFD3] hover:border-amber-500/50 hover:bg-white'
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
                                    ? 'bg-gray-800 text-white border-gray-800 shadow-md font-bold'
                                    : 'bg-[#FAF8F5] text-gray-500 border-[#E6DFD3] hover:border-gray-400 hover:bg-white'
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
                    className="flex items-center justify-between px-6 py-4 border-t border-[#E6DFD3] bg-[#FBF9F5] z-10"
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
                                bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200
                                text-xs font-medium transition-all active:scale-95 shadow-xs
                            "
                        >
                            {/* Filling Progress Indicator Bar */}
                            <div
                                style={{ width: `${resetProgress}%` }}
                                className="absolute left-0 top-0 bottom-0 bg-red-600/60 transition-all duration-75 pointer-events-none"
                            />
                            <RotateCcw size={15} className={`text-red-500 transition-transform ${resetProgress > 0 ? 'rotate-180' : ''}`} />
                            <span className="relative z-10">
                                {resetProgress > 0 ? 'Tahan...' : 'Reset'}
                            </span>
                        </button>
                    </div>

                    {/* Quick Tip / Hint */}
                    <div className="text-[11px] text-gray-400 hidden sm:block">
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
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 shadow-xs'
                                : 'bg-gray-50 text-gray-400 border-gray-200/50 cursor-not-allowed opacity-50'
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
                    className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowPresetsMenu(false)}
                >
                    <div
                        className="w-full sm:max-w-md bg-white border border-[#E6DFD3] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl spotlight-enter max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD3]">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-600" />
                                Pilihan Bacaan Dzikir
                            </h3>
                            <button
                                onClick={() => setShowPresetsMenu(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
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
                                                ? 'bg-emerald-50 border-emerald-500 text-gray-900 shadow-xs'
                                                : 'bg-[#FAF8F5] hover:bg-white border-[#E6DFD3] text-gray-700'
                                            }
                                        `}
                                    >
                                        <div className="flex-1 pr-3">
                                            <div className="text-right text-lg text-amber-700 font-arabic mb-1">
                                                {preset.arabic}
                                            </div>
                                            <div className="font-bold text-sm text-gray-900">
                                                {preset.transliteration}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                {preset.translation}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
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
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowCustomTargetModal(false)}
                >
                    <div
                        className="w-full max-w-xs bg-white border border-[#E6DFD3] rounded-2xl p-5 shadow-2xl spotlight-enter"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Settings size={18} className="text-amber-600" />
                            Target Kustom
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
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
                                    w-full px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3]
                                    text-gray-900 text-lg font-bold placeholder-gray-400 focus:outline-none focus:border-emerald-600
                                    text-center mb-4
                                "
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomTargetModal(false)}
                                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!customTargetInput || parseInt(customTargetInput, 10) <= 0}
                                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
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
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowResetConfirmModal(false)}
                >
                    <div
                        className="w-full max-w-xs bg-white border border-[#E6DFD3] rounded-2xl p-5 shadow-2xl spotlight-enter text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-3">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                            Reset Hitungan?
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Hitungan saat ini ({count}) akan dikembalikan ke angka 0.
                        </p>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    reset(false);
                                    setShowResetConfirmModal(false);
                                }}
                                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs active:scale-95"
                            >
                                Ya, Reset Hitungan
                            </button>
                            <button
                                onClick={() => {
                                    reset(true);
                                    setShowResetConfirmModal(false);
                                }}
                                className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
                            >
                                Reset Hitungan & Putaran
                            </button>
                            <button
                                onClick={() => setShowResetConfirmModal(false)}
                                className="w-full py-2 text-gray-400 hover:text-gray-700 text-xs"
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
