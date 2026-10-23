import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarGradient, initials } from "@/lib/format";

export default function RecipientAvatarCard({ recipient, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(recipient)}
      aria-label={`Send to ${recipient.name}, account ${recipient.maskedAccountNumber}`}
      className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl p-4 text-left"
    >
      <Avatar className="h-11 w-11">
        <AvatarFallback className="text-sm font-medium text-white" style={{ background: avatarGradient(recipient.name) }}>
          {initials(recipient.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{recipient.name}</span>
        <span className="block font-mono text-xs tracking-wide text-muted-foreground">{recipient.maskedAccountNumber}</span>
      </span>
    </button>
  );
}
