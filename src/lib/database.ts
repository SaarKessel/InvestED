const STORAGE_KEY = "invested_scenarios";


export async function getScenarioById(id:string){

  const saved =
    localStorage.getItem(STORAGE_KEY);


  if(!saved){
    return null;
  }


  const scenarios = JSON.parse(saved);


  return scenarios.find(
    (item:any)=>item.id === id
  ) ?? null;

}



export async function saveScenario(data:any){

  const saved =
    localStorage.getItem(STORAGE_KEY);


  const scenarios =
    saved ? JSON.parse(saved) : [];


  const scenario = {
    id: crypto.randomUUID(),
    createdAt:new Date().toISOString(),
    ...data
  };


  scenarios.unshift(scenario);


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(scenarios)
  );


  return scenario;

}