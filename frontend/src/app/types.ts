
// Memory and Message types
export type Memory = {
    id: string;
    score: number;
    userId: string;
    sessionId: string;
    memory_text: string;
    timestamp: string;
    reason: string;
    ttl_days: number;
    // category: string; // TODO
};

export type Message = {
    id: string;
    text: string;
    sender: "user" | "assistant";
};
