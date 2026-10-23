import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Command, CommandInput } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { HoverEffect } from "@/components/aceternity/card-hover-effect";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { useSearchRecipientsQuery } from "@/api/transferApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/formErrors";
import { goToStep, selectRecipient } from "../transferDraftSlice";
import RecipientAvatarCard from "./RecipientAvatarCard";
import StepHeading from "./StepHeading";

export default function RecipientStep({ initialQuery = "" }) {
  const dispatch = useDispatch();
  const selected = useSelector((s) => s.transferDraft.recipient);
  const [text, setText] = useState(initialQuery);

  const trimmed = text.trim();
  const debounced = useDebounce(trimmed, 300); // one request after you STOP typing
  const enabled = debounced.length >= 3; // matches the server's minimum
  const { data, isFetching, isError, error, refetch } = useSearchRecipientsQuery(debounced, { skip: !enabled });
  const results = enabled ? data ?? [] : [];
  const waiting = trimmed !== debounced || isFetching;

  const status =
    trimmed.length < 3
      ? "Type at least 3 characters of a name, or an exact email."
      : waiting
        ? "Searching…"
        : `${results.length} ${results.length === 1 ? "person" : "people"} found`;

  return (
    <div className="space-y-5">
      <StepHeading>Who are you sending to?</StepHeading>

      {/* The server does the filtering, so cmdk's own filtering is switched off */}
      <Command shouldFilter={false} label="Search recipients" className="rounded-xl border border-border bg-muted">
        <CommandInput value={text} onValueChange={setText} placeholder="Search name or exact email…" />
      </Command>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>

      {isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : results.length > 0 ? (
        <HoverEffect
          items={results}
          getKey={(r) => r.accountId}
          renderItem={(r) => <RecipientAvatarCard recipient={r} onSelect={(rec) => dispatch(selectRecipient(rec))} />}
        />
      ) : enabled && !waiting ? (
        <EmptyState title="No one found" hint="Only verified, active Bytebank customers appear here. Check the spelling." />
      ) : null}

      {selected && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-foreground/80">
          Currently selected: <strong>{selected.name}</strong>
          <Button variant="secondary" size="sm" onClick={() => dispatch(goToStep(2))}>
            Continue →
          </Button>
        </p>
      )}
    </div>
  );
}
