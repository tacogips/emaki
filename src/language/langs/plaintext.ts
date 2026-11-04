import type { LineLanguage } from '../../types';
export const plaintextLanguage: LineLanguage<string> = {kind:'lines',name:'plaintext',startState:()=>'',tokenizeLine:()=>({tokens:[],state:''}),sameState:(a,b)=>a===b};
