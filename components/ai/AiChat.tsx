"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./AiChat.module.css";
import { useCart } from "@/modules/cart/CartContext";
import { useAiChat } from "@/modules/ai/AiChatContext";

type QuickOption = { label: string; value: string };

type Step = {
    key: string;
    question: string;
    options?: QuickOption[];
    inputPlaceholder?: string;
};

const STEPS: Step[] = [
    {
        key: "recipient",
        question: "1. Кому ви даруєте букет?",
        options: [
            { label: "Мамі", value: "Мамі" },
            { label: "Дівчині", value: "Дівчині / коханій" },
            { label: "Другу/Колезі", value: "Другу або колезі" },
            { label: "Для себе", value: "Для себе" },
        ],
        inputPlaceholder: "або напишіть свій варіант…",
    },
    {
        key: "occasion",
        question: "2. Який привід?",
        options: [
            { label: "День народження", value: "День народження" },
            { label: "Річниця", value: "Річниця" },
            { label: "Без приводу", value: "Просто так / без приводу" },
            { label: "Свято", value: "Свято" },
        ],
        inputPlaceholder: "або напишіть свій варіант…",
    },
    {
        key: "colors",
        question: "3. Які кольори вам до душі?",
        options: [
            { label: "Рожеві / ніжні", value: "Рожеві" },
            { label: "Яскраві", value: "Яскраві" },
            { label: "Червоні", value: "Червоні" },
            { label: "Білі / кремові", value: "Білі та кремові" },
        ],
        inputPlaceholder: "або напишіть свій варіант…",
    },
    {
        key: "budget",
        question: "4. Який бюджет? (грн)",
        options: [
            { label: "до 500", value: "500" },
            { label: "до 800", value: "800" },
            { label: "до 1500", value: "1500" },
            { label: "більше 1500", value: "більше 1500 (без обмеження)" },
        ],
        inputPlaceholder: "або вкажіть свою суму…",
    },
    {
        key: "extra",
        question: "5. Є особливі побажання?",
        options: [
            { label: "Без різкого запаху", value: "Без різкого запаху" },
            { label: "З зеленню", value: "З декоративною зеленню" },
            { label: "Компактний", value: "Компактний букет" },
            { label: "Немає побажань", value: "Немає особливих побажань" },
        ],
        inputPlaceholder: "або напишіть побажання…",
    },
];

type BouquetFlower = { id: string; quantity: number; name: string; price: number; image: string; rating: number };

type Bouquet = {
    title: string;
    description: string;
    flowers: BouquetFlower[];
    totalPrice: number;
    image: string | null;
};

type Message =
    | { type: "bot"; text: string; options?: QuickOption[] }
    | { type: "user"; text: string }
    | { type: "results"; bouquets: Bouquet[] };

const INTRO: Message = {
    type: "bot",
    text: "Привіт! Я AI-помічник FloraSwift. Щоб я створив ідеальний букет, дай відповідь на кілька запитань.",
};

function BotAvatar() {
    return (
        <div className={styles.botAvatar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M8 14c-2.21 0-4 1.79-4 4h16c0-2.21-1.79-4-4-4H8z"/>
                <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>
                <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none"/>
                <path d="M9 11.5s1 1 3 1 3-1 3-1"/>
            </svg>
        </div>
    );
}

export default function AiChat() {
    const { addBouquet } = useCart();
    const { closeChat } = useAiChat();

    const [messages, setMessages] = useState<Message[]>([INTRO, { type: "bot", text: STEPS[0].question, options: STEPS[0].options }]);
    const [stepIndex, setStepIndex] = useState(0);
    const [preferences, setPreferences] = useState<Record<string, string>>({});
    const [inputVal, setInputVal] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const advanceStep = useCallback((answer: string) => {
        const currentStep = STEPS[stepIndex];
        const newPrefs = { ...preferences, [currentStep.key]: answer };
        setPreferences(newPrefs);

        const userMsg: Message = { type: "user", text: answer };

        if (stepIndex < STEPS.length - 1) {
            const nextStep = STEPS[stepIndex + 1];
            const botMsg: Message = { type: "bot", text: nextStep.question, options: nextStep.options };
            setMessages((prev) => [...prev, userMsg, botMsg]);
            setStepIndex(stepIndex + 1);
        } else {
            setMessages((prev) => [...prev, userMsg, { type: "bot", text: "Чудово! Створюю для тебе ідеальні букети…" }]);
            setStepIndex(stepIndex + 1);
            setIsLoading(true);

            fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferences: newPrefs }),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.bouquets) {
                        const finalMessages: Message[] = [
                            { type: "bot", text: "Ось що я створив для тебе:" },
                            { type: "results", bouquets: data.bouquets },
                        ];
                        setMessages((prev) => [...prev, ...finalMessages]);
                    } else {
                        const errMsg = data.error ?? "На жаль, не вдалося згенерувати букети. Спробуйте ще раз.";
                        setMessages((prev) => [...prev, { type: "bot", text: errMsg }]);
                    }
                    setIsDone(true);
                })
                .catch(() => {
                    setMessages((prev) => [...prev, { type: "bot", text: "Виникла помилка. Спробуйте ще раз." }]);
                    setIsDone(true);
                })
                .finally(() => setIsLoading(false));
        }
    }, [stepIndex, preferences]);

    const handleChip = (value: string) => {
        if (isLoading || isDone) return;
        setInputVal("");
        advanceStep(value);
    };

    const handleSend = () => {
        const text = inputVal.trim();
        if (!text || isLoading || isDone) return;
        setInputVal("");
        advanceStep(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend();
    };

    const handleRestart = () => {
        setMessages([INTRO, { type: "bot", text: STEPS[0].question, options: STEPS[0].options }]);
        setStepIndex(0);
        setPreferences({});
        setInputVal("");
        setIsLoading(false);
        setIsDone(false);
    };

    const handleAddToCart = (b: Bouquet) => {
        addBouquet({
            id: `ai-bouquet-${Date.now()}`,
            name: b.title,
            price: b.totalPrice,
            image: b.image ?? b.flowers[0]?.image ?? "",
            rating: 0,
        });
        closeChat();
    };

    const currentStep = STEPS[stepIndex];
    const showInput = !isDone && stepIndex < STEPS.length;

    const renderMessages = (msgs: Message[]) => (
        <>
            {msgs.map((msg, i) => {
                if (msg.type === "user") {
                    return (
                        <div key={i} className={`${styles.row} ${styles.rowUser}`}>
                            <div className={`${styles.bubble} ${styles.bubbleUser}`}>{msg.text}</div>
                        </div>
                    );
                }
                if (msg.type === "bot") {
                    return (
                        <div key={i} className={`${styles.row} ${styles.rowBot}`}>
                            <BotAvatar />
                            <div>
                                <div className={`${styles.bubble} ${styles.bubbleBot}`}>{msg.text}</div>
                                {msg.options && !isDone && i === msgs.length - 1 && (
                                    <div className={styles.chips}>
                                        {msg.options.map((opt) => (
                                            <button key={opt.value} className={styles.chip} onClick={() => handleChip(opt.value)} disabled={isLoading}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }
                if (msg.type === "results") {
                    return (
                        <div key={i} className={`${styles.row} ${styles.rowBot}`}>
                            <BotAvatar />
                            <div className={styles.results}>
                                {msg.bouquets.map((b, bi) => (
                                    <div key={bi} className={styles.card}>
                                        {b.image ? (
                                            <img src={b.image} alt={b.title} className={styles.cardImg} />
                                        ) : (
                                            <div className={styles.cardImgPlaceholder}>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                                    <polyline points="21 15 16 10 5 21"/>
                                                </svg>
                                                <span>Фото недоступне</span>
                                            </div>
                                        )}
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardTitle}>{b.title}</div>
                                            <div className={styles.cardDesc}>{b.description}</div>
                                            <div className={styles.cardFlowers}>
                                                {b.flowers.map((f, fi) => (
                                                    <span key={fi} className={styles.flowerTag}>
                                                        {f.name} × {f.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className={styles.cardFooter}>
                                                <span className={styles.cardPrice}>{b.totalPrice} грн</span>
                                                <button className={styles.cardBtn} onClick={() => handleAddToCart(b)}>
                                                    В кошик
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </>
    );

    return (
        <div className={styles.wrap}>
            <div className={styles.messages}>
                {renderMessages(messages)}

                {isLoading && (
                    <div className={`${styles.row} ${styles.rowBot} ${styles.typingRow}`}>
                        <BotAvatar />
                        <div className={styles.typing}>
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                        </div>
                    </div>
                )}

                {isDone && (
                    <button className={styles.restartBtn} onClick={handleRestart}>
                        Підібрати ще раз
                    </button>
                )}

                <div ref={bottomRef} />
            </div>

            {showInput && (
                <div className={styles.inputArea}>
                    <input
                        className={styles.input}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentStep?.inputPlaceholder ?? "Введіть відповідь…"}
                        disabled={isLoading}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={isLoading || !inputVal.trim()} aria-label="Надіслати">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
