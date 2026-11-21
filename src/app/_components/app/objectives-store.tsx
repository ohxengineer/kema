"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { Goal, GoalKind, Objective } from "@/app/_lib/app-sample";
import { uid } from "@/app/_lib/uid";

export type ObjectiveDraft = {
  title: string;
  kind: GoalKind;
  deadline: string;
  /** With an id when it's an existing key result being edited. */
  keyResults: {
    id?: string;
    title: string;
    target: string;
    amount: number;
    unit: string;
    days: number[];
  }[];
};

type Store = {
  objectives: Objective[];
  goals: Goal[];
  /** Adds an objective and its key results; they start with no progress. */
  create: (objective: ObjectiveDraft) => void;
  /**
   * Replaces an objective and its key results. Key results that keep their
   * id keep their progress; the ones left out are removed.
   */
  update: (id: string, objective: ObjectiveDraft) => void;
  /** Opens the create form, from any "+" button. */
  openCreate: () => void;
  creating: boolean;
  setCreating: (open: boolean) => void;
  /** Opens the same form filled in with an objective, to change it. */
  openEdit: (id: string) => void;
  /** The id of the objective being edited, if any. */
  editing: string | null;
  closeEdit: () => void;
};

const ObjectivesContext = createContext<Store | null>(null);

/**
 * The app's objectives and key results, shared by every screen: the sample
 * data plus whatever gets created in this session (kept in memory until
 * there is a backend), and whether the create form is open.
 */
export function ObjectivesProvider({
  initialObjectives,
  initialGoals,
  children,
}: {
  initialObjectives: Objective[];
  initialGoals: Goal[];
  children: ReactNode;
}) {
  const [objectives, setObjectives] = useState(initialObjectives);
  const [goals, setGoals] = useState(initialGoals);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const create = ({ title, kind, deadline, keyResults }: ObjectiveDraft) => {
    const id = uid();
    setObjectives((prev) => [...prev, { id, title, kind, deadline }]);
    setGoals((prev) => [
      ...prev,
      ...keyResults.map((kr) => ({
        id: uid(),
        objective: id,
        title: kr.title,
        target: kr.target,
        amount: kr.amount,
        unit: kr.unit,
        days: kr.days,
        kind,
        week: 0,
        doneToday: false,
      })),
    ]);
  };

  const update = (id: string, { title, kind, deadline, keyResults }: ObjectiveDraft) => {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, title, kind, deadline } : o)));
    setGoals((prev) => {
      const before = new Map(prev.filter((g) => g.objective === id).map((g) => [g.id, g]));
      const edited = keyResults.map((kr): Goal => {
        const old = kr.id ? before.get(kr.id) : undefined;
        return {
          id: old?.id ?? uid(),
          objective: id,
          title: kr.title,
          target: kr.target,
          amount: kr.amount,
          unit: kr.unit,
          days: kr.days,
          kind,
          week: old?.week ?? 0,
          doneToday: old?.doneToday ?? false,
        };
      });
      // in place of the old ones, so the objective keeps its spot in the list
      const at = prev.findIndex((g) => g.objective === id);
      const rest = prev.filter((g) => g.objective !== id);
      const index = at < 0 ? rest.length : at;
      return [...rest.slice(0, index), ...edited, ...rest.slice(index)];
    });
  };

  return (
    <ObjectivesContext.Provider
      value={{
        objectives,
        goals,
        create,
        update,
        openCreate: () => setCreating(true),
        creating,
        setCreating,
        openEdit: setEditing,
        editing,
        closeEdit: () => setEditing(null),
      }}
    >
      {children}
    </ObjectivesContext.Provider>
  );
}

export function useObjectives() {
  const store = useContext(ObjectivesContext);
  if (!store) throw new Error("useObjectives must be used inside <ObjectivesProvider>");
  return store;
}
