/* Shared browser/server estimate, anchored to an observed NFL spread/total price.
   This is a tracking heuristic, not a sportsbook alternate-line quote.
   Each favorable half-point increases the risk/profit ratio by 10%; spreads
   use 25% touching 3 and 15% touching 7. Lower Overs and higher Unders are
   favorable; selling points reverses the same factor. Always calculate
   from the market anchor, never compound rounded display prices. */
(function(root){
 'use strict';
 const model='spread-step-v1',totalModel='total-step-v1',maxAdjustment=10;
 const half=n=>typeof n==='number'&&Number.isFinite(n)&&Number.isInteger(n*2);
 function valid(base,line,market='spread'){
  return half(base)&&half(line)&&Math.abs(line-base)<=maxAdjustment&&(market==='total'?base>0&&base<=200&&line>0&&line<=200:market==='spread'&&Math.abs(base)<=100&&Math.abs(line)<=100);
 }
 function estimate(base,price,line,market='spread',side){
  if(!valid(base,line,market)||(market==='total'&&!['over','under'].includes(side))||typeof price!=='number'||!Number.isFinite(price)||Math.abs(price)<100)return null;
  if(line===base)return price;
  const direction=Math.sign(line-base),favorable=market==='total'&&side==='over'?direction<0:direction>0;let profit=price>0?price/100:100/-price;
  for(let n=base;n!==line;n+=direction*.5){
   const next=n+direction*.5,ends=[Math.abs(n),Math.abs(next)];
   const factor=market==='total'?1.1:ends.includes(3)?1.25:ends.includes(7)?1.15:1.1;
   profit*=favorable?1/factor:factor;
  }
  const result=profit>=1?Math.round(profit*100):-Math.round(100/profit);
  return Number.isSafeInteger(result)?result:null;
 }
 // Keep the existing spread API and defaults for already-cached clients.
 root.LeagueSpreadPricing={model,totalModel,maxAdjustment,valid,estimate};
})(globalThis);
