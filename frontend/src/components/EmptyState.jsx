import { InboxIcon } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center px-4">
      <InboxIcon className="w-10 h-10 text-gray-300" />
      <p className="text-gray-500 font-medium">{title}</p>
      {description && <p className="text-gray-400 text-sm">{description}</p>}
    </div>
  );
}
