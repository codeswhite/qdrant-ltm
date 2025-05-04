"use client";
import { MessageSquare, Plus, Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { Memory, Message } from "./types";
import { MemoryItem } from "./components/MemoryItem";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadedMemories, setLoadedMemories] = useState<Memory[]>([]);
  const [createdMemories, setCreatedMemories] = useState<Memory[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("loaded");

  const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";

  // Toast error helper
  const showError = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Start new session
  const newSession = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/llm/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt: "You are a helpful assistant" }),
      });
      if (!response.ok) throw new Error("Failed to create session");
      const { sessionId } = await response.json();
      setSessionId(sessionId);
      setMessages([]);
      setLoadedMemories([]);
      setCreatedMemories([]);
    } catch (err) {
      showError("Failed to create new session: " + err);
    }
  };

  // On mount, start a session
  useEffect(() => { newSession(); }, []);

  // Scroll to bottom on messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle chat submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;
    const userMessage = { id: Date.now().toString(), text: input, sender: "user" as const };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/llm/session/${sessionId}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!response.ok) throw new Error((await response.json())?.message || "Failed to get completion");
      const { assistantMessage, newFetchedMemories } = (await response.json()) as {
        assistantMessage: string;
        newFetchedMemories: Memory[];
      };
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: assistantMessage, sender: "assistant" as const },
      ]);
      if (newFetchedMemories.length > 0) {
        setLoadedMemories((prev) => [...prev, ...newFetchedMemories]);
        toast.success(`Fetched ${newFetchedMemories.length} new memories`);
      }
    } catch (err: any) {
      showError("Failed to get completion: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left side - Chat */}
      <div className="flex flex-col w-2/3 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <span className="font-medium">Session ID: {sessionId}</span>
          </div>
          <button
            onClick={newSession}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && messages[messages.length - 1].sender === "user" && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                  <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              disabled={loading}
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Memory */}
      <div className="w-1/3">
        <div className="h-full border-0 rounded-none bg-white dark:bg-gray-800 shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold">Memory</h2>
          </div>
          <div className="p-0">
            <div className="w-full border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2">
                <button
                  onClick={() => setActiveTab("created")}
                  className={`py-2 text-center font-medium text-sm transition-colors ${activeTab === "created"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  Created Memories
                </button>
                <button
                  onClick={() => setActiveTab("loaded")}
                  className={`py-2 text-center font-medium text-sm transition-colors ${activeTab === "loaded"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  Loaded Memories
                </button>
              </div>
            </div>

            {activeTab === "created" && (
              <>
                {/* <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={createMemory}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Memory
                  </button>
                </div> */}
                <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
                  {createdMemories.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No memories created yet</div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {createdMemories.map((memory) => (
                        <MemoryItem key={memory.id} memory={memory} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "loaded" && (
              <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
                {loadedMemories.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No memories loaded yet</div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loadedMemories.map((memory) => (
                      <MemoryItem key={`loaded-${memory.id}`} memory={memory} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
