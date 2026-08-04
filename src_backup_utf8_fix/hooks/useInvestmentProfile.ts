import {
  InvestmentProfile
} from "../data/investmentModels";


export function useInvestmentProfile(): InvestmentProfile {

  return {

    age:35,

    initialCapital:200000,

    monthlyContribution:3000,

    years:25,

    risk:"Growth",

    goal:"Financial Independence"

  };

}
