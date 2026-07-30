import { supabase } from "./supabase";

import { ScenarioRecord } from "../types/database";



export async function saveScenarioToCloud(

scenario: ScenarioRecord

){


const {

data,

error

}= await supabase

.from("scenarios")

.insert(scenario)

.select()

.single();



if(error){

throw error;

}



return data;


}





export async function getUserScenarios(

userId:string

){


const {

data,

error

}= await supabase

.from("scenarios")

.select("*")

.eq("user_id",userId)

.order(

"created_at",

{

ascending:false

}

);



if(error){

throw error;

}



return data ?? [];


}






export async function getScenarioById(

id:string

){


const {

data,

error

}= await supabase

.from("scenarios")

.select("*")

.eq("id",id)

.single();



if(error){

throw error;

}



return data;


}






export async function deleteScenarioFromCloud(

id:string

){


const {

error

}= await supabase

.from("scenarios")

.delete()

.eq("id",id);



if(error){

throw error;

}


}
