interface EventItem {
    id: string;
    eventType: string;
    timestamp: string;
    eventHash: string;
    prevEventHash: string | null;
    certificateHash?: string | null;
    organization: { name: string };
    data: string;
  }
  
  export default function PartTimeline({ events, brokenAtEventId }: { events: EventItem[]; brokenAtEventId?: string }) {
    return (
      <div className="space-y-4 my-6">
        {events.map((event, idx) => {
          const isBroken = event.id === brokenAtEventId;
          return (
            <div
              key={event.id}
              className={`p-4 rounded-lg border ${
                isBroken ? "bg-rose-950/80 border-rose-500" : "bg-slate-900 border-slate-700"
              }`}
            >
              <div className="flex justify-between items-center font-mono text-xs text-slate-400">
                <span>Event #{idx + 1} • {event.eventType}</span>
                <span>{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <div className="mt-2 text-sm text-slate-200">
                <strong>Issuer:</strong> {event.organization.name}
              </div>
              <div className="mt-1 text-xs text-slate-400 font-mono overflow-x-auto">
                Hash: {event.eventHash}
              </div>
              {event.prevEventHash && (
                <div className="text-xs text-slate-500 font-mono">
                  Prev: {event.prevEventHash}
                </div>
              )}
              {event.certificateHash && (
                <div className="mt-2 text-xs text-cyan-400 font-mono">
                  📜 Certificate SHA-256: {event.certificateHash}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }