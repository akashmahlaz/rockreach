"use client";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-800">
          AI Lead Generation Assistant
        </h1>
        <p className="text-slate-600">
          Tell me what you&apos;re looking for, and I&apos;ll instantly provide:
        </p>
        <div className="text-left space-y-2 text-slate-700 mx-auto max-w-xs">
          <div>✓ Full Names & Titles</div>
          <div>✓ Email Addresses</div>
          <div>✓ Phone Numbers</div>
          <div>✓ Downloadable CSV</div>
        </div>
      </div>
    </div>
  );
}
