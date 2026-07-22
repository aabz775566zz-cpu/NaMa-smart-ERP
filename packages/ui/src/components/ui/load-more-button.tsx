import { Button } from './button';

/** Shared "Load more" control for any list that pages via limit/offset —
 * a plain centered outline button, not infinite-scroll, so the user stays
 * in control of when more rows load. Only rendered by the caller when a
 * next page might actually exist (list length === current limit). */
export function LoadMoreButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading?: boolean;
  label: string;
}) {
  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" onClick={onClick} disabled={loading}>
        {loading ? '…' : label}
      </Button>
    </div>
  );
}
