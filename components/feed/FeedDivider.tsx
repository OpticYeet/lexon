export function FeedDivider() {
  return (
    <div className="flex items-center gap-4 my-8 py-4">
      <div className="flex-1 h-px bg-border" />
      <div className="text-center">
        <p className="text-sm font-medium text-success mb-0.5">
          Goal complete!
        </p>
        <p className="text-xs text-muted">Keep going — explore more papers below</p>
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
