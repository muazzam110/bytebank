import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ID_RE = /^PAY-[0-9A-Z]{10}$/;
const FIND_RE = /PAY-[0-9A-Z]{10}/i;

export default function LookupPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const go = (raw) => {
    const id = raw.trim().toUpperCase();
    if (!ID_RE.test(id)) {
      setError("Payment IDs look like PAY-8F3K29XQ7A: PAY- followed by 10 letters or numbers.");
      return;
    }
    setError("");
    navigate(`/app/transactions/${id}`);
  };

  // Paste handling: if the clipboard contains an ID anywhere in the text (e.g. a whole sentence), extract it and go
  const onPaste = (e) => {
    const match = e.clipboardData.getData("text").match(FIND_RE);
    if (!match) return; // not an ID → a normal paste
    e.preventDefault();
    setValue(match[0].toUpperCase());
    go(match[0]);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Payment lookup</h1>
      <Card className="rounded-3xl shadow-elev-2">
        <CardContent className="space-y-4 p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(value);
            }}
            className="space-y-3"
            noValidate
          >
            <Label htmlFor="payment-id">Payment ID</Label>
            <div className="flex gap-2">
              <Input
                id="payment-id"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onPaste={onPaste}
                placeholder="PAY-XXXXXXXXXX"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby="lookup-help"
                className="font-mono tracking-wide"
              />
              <Button type="submit">
                <Search className="mr-1 h-4 w-4" aria-hidden="true" />
                Find
              </Button>
            </div>
            <p id="lookup-help" role={error ? "alert" : undefined} className={error ? "text-xs text-danger" : "text-xs text-muted-foreground"}>
              {error || "You can only find payments you sent or received."}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
