import { Clock, Info } from "lucide-react"
import { Memory } from "../types"
import { useMemo } from "react";

interface MemoryItemProps {
    memory: Memory
}

export function MemoryItem({ memory }: MemoryItemProps) {

    const shortId = useMemo(() => memory.id.slice(0, 8), [memory.id]);

    return (
        <div className="flex flex-col rounded-lg p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex justify-between items-start mb-1">
                <div className="font-medium font-mono text-sm"><span className="text-gray-500">#</span> {shortId}</div>
            </div>
            <div className="mt-1 text-sm font-bold mb-2 line-clamp-2">{memory.memory_text}</div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <div className="flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    {memory.reason}
                </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    TTL: {memory.ttl_days} days
                </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">{new Date(memory.timestamp).toLocaleString()}</div>
        </div>
    )
}
