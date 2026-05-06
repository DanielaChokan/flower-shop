"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/modules/auth/AuthContext";

type AiChatContextType = {
    isOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
};

const AiChatContext = createContext<AiChatContextType | null>(null);

export function AiChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const { user, openAuth } = useAuth();

    const openChat = useCallback(() => {
        if (!user) {
            openAuth();
            return;
        }
        setIsOpen(true);
    }, [user, openAuth]);

    return (
        <AiChatContext.Provider value={{ isOpen, openChat, closeChat: () => setIsOpen(false) }}>
            {children}
        </AiChatContext.Provider>
    );
}

export function useAiChat() {
    const ctx = useContext(AiChatContext);
    if (!ctx) throw new Error("useAiChat must be used inside AiChatProvider");
    return ctx;
}
