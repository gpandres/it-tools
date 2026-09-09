import { useState } from 'react';
import { TimelineEvent } from './types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Clock, FileText } from "lucide-react";
import { useNotification } from "@/components/notification-provider";
import { MAX_TIMELINE_INPUT_LENGTH, parseLogTimeline } from "@/lib/log-timeline";
import { ToolField } from "@/components/tool-design";

const MAX_INVESTIGATION_EVENTS = 1_000;

interface TimelineViewProps {
  events: TimelineEvent[];
  onChange: (events: TimelineEvent[]) => void;
}

export default function TimelineView({ events, onChange }: TimelineViewProps) {
  const [newTimestamp, setNewTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [newDescription, setNewDescription] = useState("");
  const [newSource, setNewSource] = useState("");
  const { notify } = useNotification();

  const importLogFile = (file: File) => {
    if (file.size > MAX_TIMELINE_INPUT_LENGTH) {
      notify("Log files are limited to 5 MB in the browser.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = typeof event.target?.result === "string" ? event.target.result : "";
      const parsed = parseLogTimeline(content);
      const existing = new Set(events.map(item => `${item.timestamp}\u0000${item.description}`));
      const imported = parsed.entries
        .filter(entry => entry.timestamp)
        .filter(entry => !existing.has(`${entry.timestamp?.toISOString()}\u0000${entry.originalText}`))
        .slice(0, Math.max(0, MAX_INVESTIGATION_EVENTS - events.length))
        .map(entry => ({
          id: crypto.randomUUID(),
          timestamp: entry.timestamp!.toISOString(),
          description: entry.originalText,
          source: file.name
        }));

      if (imported.length === 0) {
        notify("No new timestamped events were found in that log file.", "error");
        return;
      }
      const updated = [...events, ...imported].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      onChange(updated);
      const skipped = parsed.withTime - imported.length;
      notify(`${imported.length} event${imported.length === 1 ? "" : "s"} imported${skipped > 0 ? `; ${skipped} skipped` : ""}.`);
    };
    reader.onerror = () => notify("Could not read the log file.", "error");
    reader.readAsText(file);
  };

  const addEvent = () => {
    if (!newDescription.trim() || !newTimestamp) {
      notify("A timestamp and event description are required.", "error");
      return;
    }
    if (events.length >= 1000) {
      notify("A timeline can contain up to 1,000 events.", "error");
      return;
    }
    
    const newEvent: TimelineEvent = {
      id: crypto.randomUUID(),
      timestamp: newTimestamp,
      description: newDescription.trim(),
      source: newSource.trim() || undefined
    };

    // Add and sort by timestamp
    const updated = [...events, newEvent].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    onChange(updated);
    setNewDescription("");
    setNewSource("");
  };

  const removeEvent = (id: string) => {
    onChange(events.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Add Event Form */}
      <div className="border border-[#1a1a1a] bg-[#050505] p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <ToolField htmlFor="new-timestamp" label="Timestamp (UTC/Local)" className="w-1/3">
            <Input 
              id="new-timestamp"
              type="datetime-local" 
              value={newTimestamp} 
              onChange={e => setNewTimestamp(e.target.value)}
              className="rounded-none border-[#1a1a1a] bg-black font-mono text-sm focus-visible:ring-[#00ff9c]"
            />
          </ToolField>
          <ToolField htmlFor="new-source" label="Source / Log File (Optional)" className="min-w-[min(100%,18rem)] flex-1">
            <Input 
              id="new-source"
              placeholder="e.g. Syslog, Windows Event 4624" 
              value={newSource} 
              onChange={e => setNewSource(e.target.value)}
              className="rounded-none border-[#1a1a1a] bg-black font-mono text-sm focus-visible:ring-[#00ff9c]"
            />
          </ToolField>
        </div>
        <ToolField htmlFor="new-description" label="Description">
          <Textarea 
            id="new-description"
            placeholder="Event description..." 
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            className="min-h-[60px] rounded-none border-[#1a1a1a] bg-black font-mono text-sm focus-visible:ring-[#00ff9c]"
          />
        </ToolField>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1a1a1a]">
          <Button onClick={addEvent} variant="outline" className="mt-2 rounded-none border-[#1a1a1a] bg-black text-zinc-300 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]">
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
          <label className="mt-2 inline-flex h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-none border border-[#1a1a1a] bg-black px-4 py-2 text-sm font-medium text-zinc-300 shadow-sm transition-colors hover:border-[#00ff9c] hover:bg-[#00ff9c]/10 hover:text-[#00ff9c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            <FileText className="mr-2 h-4 w-4" /> Import Log Events
            <input
              type="file"
              accept=".log,.txt,text/plain"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) importLogFile(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {/* Timeline Display */}
      <div className="relative ml-4 space-y-6 border-l border-[#1a1a1a] pl-6">
        {events.length === 0 && (
          <div className="py-4 font-mono text-sm text-zinc-500">No events in timeline.</div>
        )}
        
        {events.map((event) => (
          <div key={event.id} className="group relative">
            {/* Timeline dot */}
            <div className="absolute -left-[30px] top-1.5 h-2 w-2 border border-[#00ff9c] bg-[#00ff9c] transition-colors" />
            
            <div className="border border-[#1a1a1a] bg-[#050505] p-3 transition-colors hover:border-[#333]">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[#00ff9c]">
                  <Clock className="h-3 w-3" />
                  {new Date(event.timestamp).toLocaleString()}
                  {event.source && (
                    <span className="ml-2 rounded-none border border-[#1a1a1a] bg-black px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {event.source}
                    </span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 rounded-none text-zinc-500 opacity-0 transition-opacity hover:bg-red-950/20 hover:text-red-400 group-hover:opacity-100" 
                  onClick={() => removeEvent(event.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="whitespace-pre-wrap font-mono text-sm text-zinc-300">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
