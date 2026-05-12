"use client";

import { useAiChat } from "@/modules/ai/AiChatContext";
import AiChat from "./AiChat";
import styles from "./AiChatDrawer.module.css";

export default function AiChatDrawer() {
    const { isOpen, closeChat } = useAiChat();

    return (
        <>
            <div className={`${styles.overlay} ${!isOpen ? styles.overlayHidden : ""}`} onClick={closeChat} />
            <aside className={`${styles.drawer} ${!isOpen ? styles.drawerHidden : ""}`}>
                <div className={styles.header}>
                    <div className={styles.headerIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
                            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
                            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
                        </svg>
                    </div>
                    <div className={styles.headerText}>
                        <h2>AI FloraSwift Chat</h2>
                        <p>Створю ідеальний букет для тебе</p>
                    </div>
                    <button className={styles.closeBtn} onClick={closeChat} aria-label="Закрити">✕</button>
                </div>
                <div className={styles.chatWrap}>
                    <AiChat />
                </div>
            </aside>
        </>
    );
}
