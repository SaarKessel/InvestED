import { useState } from "react";

export type ScenarioItem = {
  id: string;
  createdAt: string;
  data: any;
};

const STORAGE_KEY = "invested_scenarios";

export function useScenarioHistory() {

  const [scenarios, setScenarios] = useState<ScenarioItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });


  function saveScenario(data: any) {

    const newScenario = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      data,
    };

    const updated = [
      newScenario,
      ...scenarios,
    ];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setScenarios(updated);

    return newScenario;
  }


  function deleteScenario(id: string) {

    const updated = scenarios.filter(
      item => item.id !== id
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    setScenarios(updated);
  }


  return {
    scenarios,
    saveScenario,
    deleteScenario,
  };

}