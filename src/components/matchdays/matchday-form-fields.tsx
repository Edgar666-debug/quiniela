"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { previewUtcFromDatetimeLocal } from "@/lib/matchday-form";

export function MatchdayFormFields(props: {
  number: string;
  closesAtLocal: string;
  onNumberChange: (value: string) => void;
  onClosesAtChange: (value: string) => void;
  numberId?: string;
  closesAtId?: string;
}) {
  const closesAtUtcPreview = previewUtcFromDatetimeLocal(props.closesAtLocal);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="grid gap-2">
        <Label htmlFor={props.numberId ?? "number"}>Número</Label>
        <Input
          id={props.numberId ?? "number"}
          inputMode="numeric"
          placeholder="1"
          value={props.number}
          onChange={(e) => props.onNumberChange(e.target.value)}
        />
      </div>
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor={props.closesAtId ?? "closesAt"}>Cierre (hora local)</Label>
        <Input
          id={props.closesAtId ?? "closesAt"}
          type="datetime-local"
          value={props.closesAtLocal}
          onChange={(e) => props.onClosesAtChange(e.target.value)}
        />
        {closesAtUtcPreview ? (
          <p className="text-muted-ui text-xs">Se guardará como UTC: {closesAtUtcPreview}</p>
        ) : null}
      </div>
    </div>
  );
}
