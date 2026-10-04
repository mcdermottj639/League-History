/* Shared placed-ticket display/return math and conservative receipt extraction. */
(function(root){
 'use strict';
 const round=n=>Math.round((n+Number.EPSILON)*100)/100;
 function apply(t,p){
  if(!p||!Number.isFinite(p.odds)||Math.abs(p.odds)<100)return t;
  const stake=Number.isFinite(p.stake)?p.stake:t.stake,estimatedReturn=Number.isFinite(p.potentialReturn)?p.potentialReturn:round(stake*(p.odds>0?1+p.odds/100:1+100/-p.odds));
  const mismatch=Number.isInteger(p.legCount)&&p.legCount!==t.legs.length;
  const unverified=Number.isInteger(p.legCount)&&p.legsConfirmed!==true;
  const full=Number.isInteger(p.legCount)?!mismatch&&p.legsConfirmed===true:t.full;
  let status=t.status,returned=null;
  if(mismatch||unverified){if(t.settled||t.status==='lost')status='pending';}
  else if(t.miss){status='lost';returned=0;}
  else if(t.settled&&full){
   if(t.push===t.legs.length){status='refunded';returned=stake;}
   else if(t.push){status='pending';}
   else {status='won';returned=estimatedReturn;}
  }
  return {...t,full,status,stake,combinedOdds:p.odds,estimatedReturn,returned,net:returned===null?null:round(returned-stake),calculatedOdds:t.calculatedOdds??t.combinedOdds,oddsSource:'placed',ticketLegCount:p.legCount??null,ticketMismatch:mismatch,ticketUnverified:unverified};
 }
 function parse(text){
  const s=String(text||'').replace(/[−–]/g,'-').replace(/\u00a0/g,' ');
  const amount=v=>v==null?null:Number(v.replace(/[ ,]/g,''));
  const header=s.match(/\b(\d{1,2})\s*(?:Pick|Leg)[ -]*Parlay[^\n]{0,35}?([+-]\s*[\d,]{3,})/i);
  const count=header?.[1]||s.match(/\b(\d{1,2})\s*(?:Pick|Leg)[ -]*Parlay/i)?.[1];
  const odds=header?amount(header[2]):null;
  const stake=amount(s.match(/\bWager\s*:?\s*\$\s*([\d,]+\.\d{2})/i)?.[1]);
  const potentialReturn=amount(s.match(/\bTo\s*Pay\s*:?\s*\$\s*([\d,]+\.\d{2})/i)?.[1]);
  const legCount=count?Number(count):null;
  return {odds:Number.isSafeInteger(odds)&&Math.abs(odds)>=100?odds:null,stake,potentialReturn,legCount:legCount>=1&&legCount<=99?legCount:null};
 }
 root.LeagueTicketValues={apply,parse};
})(globalThis);
