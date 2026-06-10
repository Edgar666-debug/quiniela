"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MatchdayFormFields(props: {
  number: string;
  closesAtLocal: string;
  onNumberChange: (value: string) => void;
  onClosesAtChange: (value: string) => void;
  numberId?: string;
  closesAtId?: string;
}) {

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
      </div>
    </div>
  );
}
