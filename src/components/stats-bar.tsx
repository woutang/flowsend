type Props = {
  sentToday: number;
  sentThisWeek: number;
  totalSent: number;
};

export function StatsBar({ sentToday, sentThisWeek, totalSent }: Props) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <div>
        <span className="font-medium text-foreground">{sentToday}</span> sent today
      </div>
      <div className="h-4 w-px bg-border" />
      <div>
        <span className="font-medium text-foreground">{sentThisWeek}</span> this week
      </div>
      <div className="h-4 w-px bg-border" />
      <div>
        <span className="font-medium text-foreground">{totalSent}</span> all time
      </div>
    </div>
  );
}
