import { useState } from 'react';
import { TimelineEvent } from './types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Clock } from "lucide-react";

interface TimelineViewProps {
  events: TimelineEvent[];
  onChange: (events: TimelineEvent[]) => void;
}

export default function TimelineView({ events, onChange }: TimelineViewProps) {
  const [newTimestamp, setNewTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [newDescription, setNewDescription] = useState("");
  const [newSource, setNewSource] = useState("");

  const addEvent = () => {
    if (!newDescription.trim() || !newTimestamp) return;
    
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
        <div className="flex gap-3">
          <div className="w-1/3">
            <label className="text-xs text-zinc-500 uppercase font-mono mb-1 block">Timestamp (UTC/Local)</label>
            <Input 
              type="datetime-local" 
              value={newTimestamp} 
              onChange={e => setNewTimestamp(e.target.value)}
              className="bg-black border-[#333] text-sm"
            />
          </div>
          <div className="w-2/3">
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
        <Button onClick={addEvent} className="bg-white text-black hover:bg-zinc-200">
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
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
