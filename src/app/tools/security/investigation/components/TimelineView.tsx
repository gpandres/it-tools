import { useState } from 'react';
import { TimelineEvent } from './types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Clock, FileText } from "lucide-react";
import { useNotification } from "@/components/notification-provider";
import { MAX_TIMELINE_INPUT_LENGTH, parseLogTimeline } from "@/lib/log-timeline";

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
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-1/3">
            <label className="text-xs text-zinc-500 uppercase font-mono mb-1 block">Timestamp (UTC/Local)</label>
            <Input 
              type="datetime-local" 
              value={newTimestamp} 
              onChange={e => setNewTimestamp(e.target.value)}
              className="bg-black border-[#333] text-sm"
            />
          </div>
          <div className="min-w-[min(100%,18rem)] flex-1">
            <label className="text-xs text-zinc-500 uppercase font-mono mb-1 block">Source / Log File (Optional)</label>
            <Input 
              placeholder="e.g. Syslog, Windows Event 4624" 
              value={newSource} 
              onChange={e => setNewSource(e.target.value)}
              className="bg-black border-[#333] text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase font-mono mb-1 block">Description</label>
          <Textarea 
            placeholder="Event description..." 
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            className="bg-black border-[#333] text-sm min-h-[60px]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={addEvent} className="bg-white text-black hover:bg-zinc-200">
            <Plus className="w-4 h-4 mr-2" /> Add Event
          </Button>
          <label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-[#333] bg-black px-3 text-sm text-zinc-300 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c]">
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
      <div className="relative border-l-2 border-[#1a1a1a] ml-4 pl-6 space-y-6">
        {events.length === 0 && (
          <div className="text-zinc-500 text-sm py-4">No events in timeline.</div>
        )}
        
        {events.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline dot */}
            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-[#00ff9c] group-hover:bg-[#00ff9c] transition-colors" />
            
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 hover:border-[#333] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00ff9c]">
                  <Clock className="w-3 h-3" />
                  {new Date(event.timestamp).toLocaleString()}
                  {event.source && (
                    <span className="ml-2 text-zinc-500 border border-zinc-700 bg-zinc-900 px-1.5 rounded text-[10px]">
                      {event.source}
                    </span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                  onClick={() => removeEvent(event.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
