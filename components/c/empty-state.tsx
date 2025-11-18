"use client";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-8">
        <h1 className="text-3xl font-medium text-white">
          What's on your mind today?
        </h1>
      </div>
    </div>
  );
}
