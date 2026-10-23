import { useDispatch, useSelector } from "react-redux";
import { setReduceEffects, toggleBalanceHidden } from "@/features/ui/uiSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function PreferencesCard() {
  const dispatch = useDispatch();
  const { balanceHidden, reduceEffects } = useSelector((s) => s.ui);
  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="pref-effects">Reduce celebration effects</Label>
            <p className="text-xs text-muted-foreground">Turns off beams, sparkles, count-ups and animated loaders.</p>
          </div>
          <Switch id="pref-effects" checked={reduceEffects} onCheckedChange={(v) => dispatch(setReduceEffects(v))} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="pref-hide">Hide my balance</Label>
            <p className="text-xs text-muted-foreground">Blurs the balance on the dashboard. Saved on this device only.</p>
          </div>
          <Switch id="pref-hide" checked={balanceHidden} onCheckedChange={() => dispatch(toggleBalanceHidden())} />
        </div>
      </CardContent>
    </Card>
  );
}
