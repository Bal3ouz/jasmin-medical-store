/**
 * Streamed instantly by Next while the server-rendered page is in flight.
 * Without it, clicking a nav link looks like nothing happened until the
 * server renders the next page (DB queries can add a few hundred ms over
 * the eu-west-1 → DE hop).
 */
export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-3 w-24 rounded-pill bg-warm-taupe-soft/20" />
      <div className="h-12 w-2/3 max-w-md rounded-md bg-warm-taupe-soft/15" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-cream-sand shadow-soft" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-cream-sand shadow-soft" />
    </div>
  );
}
