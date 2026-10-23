/* Shared browser/server estimate, anchored to an observed NFL spread price.
   This is a tracking heuristic, not a sportsbook alternate-line quote.
   Each half-point increases the risk/profit ratio by 10% (25% touching 3,
   15% touching 7); selling points reverses the same factor. Always calculate
   from the market anchor, never compound rounded display prices. */
(function(root){
 'use strict';
 const model='spread-step-v1',maxAdjustment=10;
 const half=n=>typeof n==='number'&&Number.isFinite(n)&&Number.isInteger(n*2);
 function valid(base,line){return half(base)&&half(line)&&Math.abs(base)<=100&&Math.abs(line)<=100&&Math.abs(line-base)<=maxAdjustment;}
 function estimate(base,price,line){
  if(!valid(base,line)||typeof price!=='number'||!Number.isFinite(price)||Math.abs(price)<100)return null;
  if(line===base)return price;
  const direction=Math.sign(line-base);let profit=price>0?price/100:100/-price;
  for(let n=base;n!==line;n+=direction*.5){
   const next=n+direction*.5,ends=[Math.abs(n),Math.abs(next)];
   const factor=ends.includes(3)?1.25:ends.includes(7)?1.15:1.1;
   profit*=direction>0?1/factor:factor;
  }
  const result=profit>=1?Math.round(profit*100):-Math.round(100/profit);
  return Number.isSafeInteger(result)?result:null;
 }
 root.LeagueSpreadPricing={model,maxAdjustment,valid,estimate};
})(globalThis);
