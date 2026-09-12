/* ══════════════════════════════════════════════════════════════════════════
   📜 history.js — LEAGUE HISTORY for Nectars Bolonga (2013-2025)
   Loaded by index.html before app.js; exposes ONE global, `LeagueHistory`.

   Why its own file rather than more app.js: this is a fixed, curated archive
   of 13 seasons that never changes at runtime and touches nothing else in the
   app — no ESPN call, no backend, no localStorage. Keeping it out of app.js
   means a season's worth of data can be corrected without re-reading the
   10,750-line file it would otherwise be buried in.

   🚨 THE DATA IS THE PRODUCT, AND IT WAS VERIFIED, NOT TRANSCRIBED.
   Every team name is mapped to a PERSON, cross-checked against ESPN's own
   owner-name column on the seasons that carry it (~144 confirmations, one
   correction: "Christels Mattress" is Will Hurd, named AT Christel rather
   than by him — the same trap as "Slemp The Man Whore", which is McD's).
   Conservation laws over the finished tables are in the repo's scratch
   harness: 150 season-finishes, 13 titles, 24 Cum Bowl appearances, 11 Cum
   Bowl losses, 238 bracket game-slots, 76 playoff berths — all balance.

   🚨 AND IT HOLDS THREE KINDS OF FACT THAT MUST NEVER BE CONFLATED.
   See the SRC table below: a regular-season record, a playoff-games-only
   record, and a final playoff placing are three different things, and the
   archive has no regular-season SCHEDULE at all — so nothing in here is a
   career head-to-head, however much it looks like one. Every view carries a
   badge saying which it is. If you add a stat, tag it.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  /* ══════════════════════════════════════════════════════════════════════════
     LEAGUE_HISTORY — Nectars Bolonga, 2013-2025.
     Source: ESPN's own League History page (12 seasons, 2013-2024) + the
     2025 Sleeper all-time standings screenshot.

     🚨 THE RANK IS THE FINAL (PLAYOFF) FINISH; THE RECORD IS THE REGULAR
     SEASON. They routinely disagree — 2023's champion went 7-7 and 2021's
     11-3 team finished 3rd — and that gap IS the history worth showing.
     ══════════════════════════════════════════════════════════════════════ */
  const LEAGUE_HISTORY = [
    { yr: 2025, games: 14, platform: "sleeper", finalOrder: true, lastKnown: false, champ: "JMcD6", worst: "buleyn14", final: { w: "JMcD6", ws: 124.04, l: "Cheeky_Clapz", ls: 107.28 }, rows: [
      { t: "JMcD6", w: 11, l: 3, pf: 1543.74, pa: 1473.52, tx: 37, seed: 1 },
      { t: "Cheeky_Clapz", w: 7, l: 7, pf: 1507.02, pa: 1413.76, tx: 24, seed: 6 },
      { t: "Gotch118", w: 8, l: 6, pf: 1546.24, pa: 1405.84, tx: 14, seed: 2 },
      { t: "Morning_Woods", w: 8, l: 6, pf: 1458.26, pa: 1495.7, tx: 21, seed: 4 },
      { t: "wolffj10", w: 7, l: 7, pf: 1552.14, pa: 1567.1, tx: 52, seed: 5 },
      { t: "BonJiles", w: 8, l: 6, pf: 1524.5, pa: 1411.48, tx: 28, seed: 3 },
      { t: "samrizz", w: 7, l: 7, pf: 1506.52, pa: 1424.44, tx: 23, seed: 7 },
      { t: "TheCaptainCC", w: 7, l: 7, pf: 1433.28, pa: 1424.6, tx: 37, seed: 8 },
      { t: "AarrogantFraudg", w: 6, l: 8, pf: 1317.94, pa: 1386.88, tx: 34, seed: 10, tie: "9-10" },
      { t: "schristel26", w: 3, l: 11, pf: 1446.54, pa: 1638.84, tx: 3, seed: 12, tie: "9-10" },
      { t: "buleyn14", w: 5, l: 9, pf: 1257.98, pa: 1391.64, tx: 40, seed: 11, tie: "11-12" },
      { t: "Slempw92", w: 7, l: 7, pf: 1387.86, pa: 1448.22, tx: 29, seed: 9, tie: "11-12" },
    ]},
    { yr: 2024, games: 14, final: { w: "Thurgood Marshall", ws: 89.8, l: "Jared Goff Hits Women", ls: 73.4 }, rows: [
      { t: "Thurgood Marshall", w: 11, l: 3, pf: 1491.2, pa: 1400.4, seed: 1 },
      { t: "Jared Goff Hits Women", w: 7, l: 7, pf: 1449.9, pa: 1484.6, seed: 6 },
      { t: "Slob on my Cobb", w: 11, l: 3, pf: 1474.1, pa: 1304.3, seed: 2 },
      { t: "Death Dont Hurts Very Long", w: 7, l: 7, pf: 1491, pa: 1492.7, seed: 4 },
      { t: "Morning Woods", w: 10, l: 4, pf: 1519.5, pa: 1358, seed: 3 },
      { t: "Pepperoni TDs", w: 7, l: 7, pf: 1470.9, pa: 1406.5, seed: 5 },
      { t: "Jefferson Airplane", w: 5, l: 9, pf: 1453.1, pa: 1584.2, seed: 10 },
      { t: "Mortal Wombats", w: 4, l: 10, pf: 1446.4, pa: 1569, seed: 11 },
      { t: "Puka Atta Adonai", w: 7, l: 7, pf: 1428.1, pa: 1410.8, seed: 7 },
      { t: "Aarogant Fraudgers", w: 5, l: 9, pf: 1463.8, pa: 1627.1, seed: 9 },
      { t: "Gregs Morning Dew Dew", w: 4, l: 10, pf: 1437.7, pa: 1446.2, seed: 12 },
      { t: "Brown N' White Catholic Chubbs", w: 6, l: 8, pf: 1403.9, pa: 1445.8, seed: 8 },
    ]},
    { yr: 2023, games: 14, final: { w: "Gregs Morning Dew Dew", ws: 114.2, l: "Burrow My Johnson'In Her Pitts", ls: 100.6 }, rows: [
      { t: "Gregs Morning Dew Dew", w: 7, l: 7, pf: 1469.2, pa: 1497.8, seed: 6 },
      { t: "Burrow My Johnson'In Her Pitts", w: 10, l: 4, pf: 1574.9, pa: 1400.7, seed: 1 },
      { t: "Death Dont Hurts Very Long", w: 8, l: 6, pf: 1596.9, pa: 1434.4, seed: 4 },
      { t: "Aarogant Fraudgers", w: 10, l: 4, pf: 1513.4, pa: 1343.4, seed: 2 },
      { t: "Mortal Wombats", w: 9, l: 5, pf: 1497.8, pa: 1258.6, seed: 3 },
      { t: "Morning Woods", w: 8, l: 6, pf: 1475.3, pa: 1435.1, seed: 5 },
      { t: "Mooney Tunes", w: 2, l: 12, pf: 1313.9, pa: 1535.5, seed: 12 },
      { t: "Football Team", w: 7, l: 7, pf: 1369.4, pa: 1451, seed: 8 },
      { t: "Pepperoni TDs", w: 7, l: 7, pf: 1315.6, pa: 1443, seed: 9 },
      { t: "Slob on my Cobb", w: 3, l: 11, pf: 1273.9, pa: 1533.2, seed: 11 },
      { t: "Giants fkng suck", w: 7, l: 7, pf: 1447.2, pa: 1439.4, seed: 7 },
      { t: "Ja' Marrma Dance", w: 6, l: 8, pf: 1445.3, pa: 1520.7, seed: 10 },
    ]},
    { yr: 2022, games: 14, final: { w: "Death Dont Hurts Very Long", ws: 114.1, l: "Pepperoni TDs", ls: 99.1 }, rows: [
      { t: "Death Dont Hurts Very Long", w: 8, l: 6, pf: 1441.1, pa: 1422.7, seed: 5 },
      { t: "Pepperoni TDs", w: 9, l: 5, pf: 1431.8, pa: 1386, seed: 3 },
      { t: "Gregs Morning Dew Dew", w: 9, l: 5, pf: 1478.4, pa: 1427.7, seed: 2 },
      { t: "Ja' Marrma Dance", w: 9, l: 5, pf: 1626.8, pa: 1420.6, seed: 1 },
      { t: "Morning Woods", w: 8, l: 6, pf: 1469.9, pa: 1379.4, seed: 4 },
      { t: "Eye of the Jeu", w: 8, l: 6, pf: 1422.6, pa: 1315.2, seed: 6 },
      { t: "Football Team", w: 7, l: 7, pf: 1424.6, pa: 1464.1, seed: 7 },
      { t: "Mortal Wombats", w: 6, l: 8, pf: 1488.6, pa: 1587.4, seed: 8 },
      { t: "Run DM, See?", w: 6, l: 8, pf: 1462.5, pa: 1472.9, seed: 9 },
      { t: "London Silly Willies", w: 4, l: 10, pf: 1419.2, pa: 1482.1, seed: 11 },
      { t: "Slob on my Cobb", w: 4, l: 10, pf: 1241.7, pa: 1456.4, seed: 12 },
      { t: "Return Of The Mac", w: 6, l: 8, pf: 1359.7, pa: 1452.4, seed: 10 },
    ]},
    { yr: 2021, games: 14, final: { w: "Slob on my Cobb", ws: 120.5, l: "Return Of The Mac", ls: 110.7 }, rows: [
      { t: "Slob on my Cobb", w: 8, l: 6, pf: 1591.4, pa: 1529.5, seed: 5 },
      { t: "Return Of The Mac", w: 10, l: 4, pf: 1639.6, pa: 1383.6, seed: 3 },
      { t: "Hill Top Hoods", w: 11, l: 3, pf: 1744.6, pa: 1493.5, seed: 1 },
      { t: "Alvin and the Shitmonks", w: 10, l: 4, pf: 1661.7, pa: 1360.7, seed: 2 },
      { t: "Godwins If Hes Thelan a Sermon", w: 7, l: 7, pf: 1449.7, pa: 1566.7, seed: 6 },
      { t: "Mortal Wombats", w: 9, l: 5, pf: 1459.6, pa: 1382.2, seed: 4 },
      { t: "Run DM, See?", w: 6, l: 8, pf: 1436.9, pa: 1468.8, seed: 8 },
      { t: "Death Dont Hurts Very Long", w: 3, l: 11, pf: 1247.8, pa: 1547.4, seed: 11 },
      { t: "Morning Woods", w: 6, l: 8, pf: 1414.2, pa: 1397.3, seed: 9 },
      { t: "Jam Boys", w: 5, l: 9, pf: 1278.6, pa: 1467, seed: 10 },
      { t: "Football Team", w: 6, l: 8, pf: 1517.5, pa: 1530.5, seed: 7 },
      { t: "Pepperoni TDs", w: 3, l: 11, pf: 1171.8, pa: 1486.2, seed: 12 },
    ]},
    { yr: 2020, games: 13, rows: [
      { t: "Morning Woods", w: 10, l: 3, pf: 1311.9, pa: 1229.9, seed: 2 },
      { t: "Death Hurts", w: 7, l: 6, pf: 1571.8, pa: 1391.5, seed: 5 },
      { t: "Alvin and the Shitmonks", w: 12, l: 1, pf: 1592.7, pa: 1273.4, seed: 1 },
      { t: "Hill Top Hoods", w: 9, l: 4, pf: 1421.2, pa: 1318.3, seed: 3 },
      { t: "Mortal Wombats", w: 9, l: 4, pf: 1294.4, pa: 1283.3, seed: 4 },
      { t: "Pepperoni TDs", w: 7, l: 6, pf: 1443.9, pa: 1406.9, seed: 6 },
      { t: "Big Dick Nick", w: 3, l: 10, pf: 1264.8, pa: 1277.9, seed: 12 },
      { t: "Slob on my Cobb", w: 4, l: 9, pf: 1269.2, pa: 1366.9, seed: 10 },
      { t: "The Knee Grows Football Team", w: 5, l: 8, pf: 1379.6, pa: 1476.1, seed: 7 },
      { t: "Aarrogant Fraudgers", w: 3, l: 10, pf: 1313.5, pa: 1598.1, seed: 11 },
      { t: "Colonel Foreskins", w: 5, l: 8, pf: 1245.9, pa: 1366.1, seed: 8 },
      { t: "Fresh Prince Of Hel-Aire", w: 4, l: 9, pf: 1354.8, pa: 1475.3, seed: 9 },
    ]},
    { yr: 2019, games: 13, rows: [
      { t: "Pepperoni TDs", w: 9, l: 4, pf: 1568.4, pa: 1472.9, seed: 1 },
      { t: "Morning Woods", w: 8, l: 5, pf: 1489.3, pa: 1304.7, seed: 3 },
      { t: "My Knee Grows", w: 9, l: 4, pf: 1447.5, pa: 1290.3, seed: 2 },
      { t: "Smoke a Bowe, Drink a Forte", w: 7, l: 6, pf: 1375.3, pa: 1289.8, seed: 5 },
      { t: "Mortal Wombats", w: 7, l: 6, pf: 1379.5, pa: 1267.9, seed: 4 },
      { t: "Slob on my Cobb", w: 7, l: 6, pf: 1226.4, pa: 1236.1, seed: 6 },
      { t: "De'Coldest ToEvadoit", w: 6, l: 7, pf: 1345.6, pa: 1424.3, seed: 8 },
      { t: "My Chubb Always Fitz", w: 5, l: 8, pf: 1270.1, pa: 1345.5, seed: 11 },
      { t: "Hill Top Hoods", w: 5, l: 8, pf: 1322.5, pa: 1475.3, seed: 10 },
      { t: "The Great Wentz", w: 6, l: 7, pf: 1277.9, pa: 1489.2, seed: 9 },
      { t: "Colonel Foreskins", w: 3, l: 10, pf: 1166.4, pa: 1363.2, seed: 12 },
      { t: "Aarrogant Fraudgers", w: 6, l: 7, pf: 1427.7, pa: 1337.4, seed: 7 },
    ]},
    { yr: 2018, games: 13, rows: [
      { t: "The Great Wentz", w: 7, l: 6, pf: 1489.2, pa: 1469, seed: 6 },
      { t: "Smoke a Bowe, Drink a Forte", w: 11, l: 2, pf: 1525.4, pa: 1221.9, seed: 1 },
      { t: "Aarrogant Fraudgers", w: 9, l: 4, pf: 1674.3, pa: 1524.8, seed: 2 },
      { t: "Mortal Wombats", w: 8, l: 5, pf: 1372.1, pa: 1351.3, seed: 5 },
      { t: "Cook'n up Grahams", w: 8, l: 5, pf: 1443.6, pa: 1365.7, seed: 4 },
      { t: "Soft Hands Rough Handys", w: 8, l: 5, pf: 1565.3, pa: 1368.3, seed: 3 },
      { t: "Pepperoni TDs", w: 6, l: 7, pf: 1486.5, pa: 1491, seed: 7 },
      { t: "My Knee Grows", w: 6, l: 7, pf: 1403.8, pa: 1355.8, seed: 8 },
      { t: "Morning Woods", w: 4, l: 9, pf: 1289.4, pa: 1427.9, seed: 10 },
      { t: "Greg's Pirate Daddy", w: 5, l: 8, pf: 1282.1, pa: 1462.3, seed: 9 },
      { t: "Slob on my Cobb", w: 2, l: 11, pf: 1164.6, pa: 1428.1, seed: 12 },
      { t: "Whipits Rule", w: 4, l: 9, pf: 1233.4, pa: 1463.6, seed: 11 },
    ]},
    { yr: 2017, games: 13, rows: [
      { t: "Morning Woods", w: 8, l: 5, pf: 1422.1, pa: 1153.3 },
      { t: "My Knee Grows", w: 9, l: 4, pf: 1343.5, pa: 1214.7 },
      { t: "Shady (ACL) Crack Cooks", w: 7, l: 6, pf: 1235, pa: 1320.9 },
      { t: "What Can Browns Do For Jews", w: 8, l: 5, pf: 1286.6, pa: 1267.4 },
      { t: "Pepperoni TD's", w: 8, l: 5, pf: 1399.6, pa: 1288.7 },
      { t: "The Great Wentz", w: 7, l: 6, pf: 1352.7, pa: 1282.2 },
      { t: "Greg's Father", w: 6, l: 7, pf: 1300.2, pa: 1279.9 },
      { t: "Smoke a Bowe, Drink a Forte", w: 6, l: 7, pf: 1258.9, pa: 1341 },
      { t: "Billy Breathes", w: 5, l: 8, pf: 1252, pa: 1291.5 },
      { t: "Slob on my Cobb", w: 6, l: 7, pf: 1204.8, pa: 1291.5 },
      { t: "Greggs Morning Dew Dew", w: 3, l: 10, pf: 1196.7, pa: 1341.8 },
      { t: "Mortal Wombats", w: 5, l: 8, pf: 1232.5, pa: 1411.7 },
    ]},
    { yr: 2016, games: 13, rows: [
      { t: "Air Cunt", w: 8, l: 5, pf: 1323.5, pa: 1097.4 },
      { t: "Greg's Father", w: 9, l: 4, pf: 1110.1, pa: 1111.6 },
      { t: "I Had a Dog His Name Was Jimmy", w: 11, l: 2, pf: 1403.1, pa: 1166.7 },
      { t: "Smoke a Bowe, Drink a Forte", w: 10, l: 3, pf: 1234.7, pa: 1177.3 },
      { t: "My Knee Grows", w: 7, l: 6, pf: 1199.3, pa: 1170.9 },
      { t: "Frank's Whores", w: 7, l: 6, pf: 1192.3, pa: 1135 },
      { t: "Slob on my Cobb", w: 6, l: 7, pf: 1181.7, pa: 1145.7 },
      { t: "Mortal Wombats", w: 3, l: 10, pf: 1070.3, pa: 1274.8 },
      { t: "Jim Crow All-Stars", w: 5, l: 8, pf: 1142.2, pa: 1220.9 },
      { t: "I'm Fucked", w: 3, l: 10, pf: 950.8, pa: 1146.4 },
      { t: "Gregs Morning Dew Dew", w: 3, l: 10, pf: 1209.2, pa: 1314 },
      { t: "What Can Browns Do For Jews", w: 6, l: 7, pf: 1186.8, pa: 1243.3 },
    ]},
    { yr: 2015, games: 13, rows: [
      { t: "Jim Crow All-Stars", w: 8, l: 5, pf: 1117.3, pa: 1157.4 },
      { t: "Furher Goodell", w: 9, l: 4, pf: 1199, pa: 1105.7 },
      { t: "My Knee Grows", w: 8, l: 5, pf: 1299.1, pa: 1147.9 },
      { t: "The Bash Brothers", w: 9, l: 4, pf: 1357.1, pa: 1124 },
      { t: "Mr. Flee Flee Fleeeeener", w: 7, l: 6, pf: 1113.1, pa: 1226.8 },
      { t: "Gregs Morning Dew Dew", w: 8, l: 5, pf: 1237.8, pa: 1260.6 },
      { t: "Tucker Right In The Pussy", w: 5, l: 8, pf: 1172.2, pa: 1352 },
      { t: "Smoke a Bowe, Drink a Forte", w: 5, l: 8, pf: 1188.9, pa: 1213.1 },
      { t: "Slob on my Cobb", w: 5, l: 8, pf: 1172.1, pa: 1212.8 },
      { t: "Immortal Wombats", w: 6, l: 7, pf: 1177.1, pa: 1184.2 },
      { t: "Help Please Help", w: 3, l: 10, pf: 1114.1, pa: 1204.9 },
      { t: "Greg's Father", w: 5, l: 8, pf: 1134.8, pa: 1093.2 },
    ]},
    { yr: 2014, games: 13, rows: [
      { t: "Slob on my Cobb", w: 7, l: 6, pf: 1232.5, pa: 1194.4 },
      { t: "Mike Hunthurts hunthurts", w: 7, l: 6, pf: 1146.5, pa: 1105.1 },
      { t: "wreck it Ray", w: 11, l: 2, pf: 1386.1, pa: 1183.4 },
      { t: "My Knee Grows", w: 9, l: 4, pf: 1225, pa: 1167.5 },
      { t: "Buley is Greek", w: 7, l: 6, pf: 1232.9, pa: 1295 },
      { t: "Hoyer... Fornicator", w: 7, l: 6, pf: 1285, pa: 1226.8 },
      { t: "Weggie Rayne", w: 6, l: 7, pf: 1255.5, pa: 1217.4 },
      { t: "BALTIMORE STAND UP", w: 6, l: 7, pf: 1136.5, pa: 1259.7 },
      { t: "Hugh Junions", w: 5, l: 8, pf: 1201.3, pa: 1181.3 },
      { t: "Kitchens Hammer", w: 6, l: 7, pf: 1123, pa: 1145.9 },
      { t: "Jamm Boys", w: 4, l: 9, pf: 1158.9, pa: 1159.1 },
      { t: "Dez-ed and Confused", w: 3, l: 10, pf: 991.8, pa: 1239.4 },
    ]},
    { yr: 2013, games: 13, rows: [
      { t: "Slob on my Cobb", w: 7, l: 6, pf: 1246.2, pa: 1211.4 },
      { t: "Mike Hawksuge hawksuge", w: 7, l: 6, pf: 1197.4, pa: 1157.6 },
      { t: "Weggie Rayne", w: 9, l: 4, pf: 1224.2, pa: 1097 },
      { t: "Jamm Boys", w: 11, l: 2, pf: 1348.7, pa: 944.6 },
      { t: "Cutty-Marshall ALLDAYBABY", w: 7, l: 6, pf: 1284.5, pa: 1206.8 },
      { t: "Christels Mattress", w: 9, l: 4, pf: 1385.6, pa: 1192.8 },
      { t: "Dow Jones", w: 4, l: 9, pf: 1007.3, pa: 1311.1 },
      { t: "Slemp The Man Whore", w: 5, l: 8, pf: 1049.6, pa: 1255.8 },
      { t: "Kitchen Sink", w: 7, l: 6, pf: 1177.5, pa: 1127.8 },
      { t: "My Knee Grows", w: 5, l: 8, pf: 1163.8, pa: 1237.6 },
      { t: "Hugh Junions", w: 2, l: 11, pf: 884, pa: 1216.4 },
      { t: "Team Wolff", w: 5, l: 8, pf: 1170.1, pa: 1180 },
    ]},
  ];

  /* ── WHO OWNED WHAT ────────────────────────────────────────────────────────
     🚨 Team names change every year; the twelve people do not. This is the
     ONLY thing that turns a pile of standings into all-time records — and it
     is the thing ESPN's export does NOT carry.
     Seeded from names that survive to today (power.js MANAGERS/NICKS +
     LEAGUE_ORDER). Everything else is UNCLAIMED and stays that way until the
     owner says so — a guessed manager silently rewrites the title count. */
  const HIST_MGR = {
    'slob on my cobb':               'Slemp',
    'morning woods':                 'Woods',
    'jim crow all-stars':            'Woods',   // 2015-16 — 2015 champion
    'thurgood marshall':             'Gotch',
    'gregs morning dew dew':         'Buley',
    'greggs morning dew dew':        'Buley',
    'jared goff hits women':         'Zach',
    'death dont hurts very long':    'McD',
    'air cunt':                      'McD',   // owner, 2016 — champion
    'the great wentz':               'McD',   // owner, 2017-19 — 2018 champion
    'death hurts':                   'McD',   // owner, 2020 — runner-up
    'the bash brothers':             'McD',   // owner, 2015
    'buley is greek':                'McD',   // owner, 2014 — NOT Buley, despite the name
    'slemp the man whore':           'McD',   // owner, 2013 — NOT Slemp, despite the name
    'team wolff':                    'Wolff',
    'christels mattress':            'Hurd',      // ⚠️ NOT Christel — named AT him, not BY him
    // ── owner-supplied, this session ──────────────────────────────────────
    'mortal wombats':                'Christel',
    'immortal wombats':              'Christel',  // 2015 — "all Wombats are Christel"
    'my knee grows':                 'Zach',
    'the knee grows football team':  'Zach',      // 2020 — bridges My Knee Grows → Football Team
    'football team':                 'Zach',      // owner said "I think" — verify
    'smoke a bowe, drink a forte':   'Gotch',
    "greg's father":                 'Riz',
    'hill top hoods':                'Riz',
    'aarrogant fraudgers':           'Hurd',      // 2018-20 spelling
    'aarogant fraudgers':            'Hurd',      // 2023-24 spelling, one 'r'
    'pepperoni tds':                 'Hyman',     // 2018-24 — 2019 champion
    "pepperoni td's":                'Hyman',     // 2017 spelling, apostrophe
    /* ── Confirmed against ESPN's OWN owner-name column (2018/20/21/23).
       Those four seasons confirmed 31 existing mappings with ZERO conflicts
       and added the 16 below. Real names, for the record:
         McD = jack mcdermott      Slemp = William Slemp
         Woods = Jack Woods        Gotch = William Gotschewski
         Zach = Zachary Molan      Hyman = David Hyman
         Buley = Nick Buley        Hurd = Will Hurd
         Christel = sam christel   Wolff = Justin Wolff
         CC = Chris Crawford       Riz = Sam & William Risley
         CC = Chris Crawford, and ALSO 'Joe Wickman' 2013-18 — the same
              person under an earlier ESPN account name. Verified: the two
              never share a season and together cover all 13 with no gap.
       ⚠️ 2020's Slob on my Cobb shows the display name RAISEN THE BEST, not
       William Slemp. Same franchise every other year, so it is read as Slemp. */
    "cook'n up grahams": "CC",
    "soft hands rough handys": "Wolff",
    "greg's pirate daddy": "Riz",
    "whipits rule": "Buley",
    "alvin and the shitmonks": "Wolff",
    "big dick nick": "Gotch",
    "colonel foreskins": "Buley",
    "fresh prince of hel-aire": "CC",
    "return of the mac": "Hurd",
    "godwins if hes thelan a sermon": "CC",
    "run dm, see?": "Gotch",
    "jam boys": "Buley",
    "burrow my johnson'in her pitts": "CC",
    "mooney tunes": "Gotch",
    "giants fkng suck": "Wolff",
    "ja' marrma dance": "Riz",
    /* 2015-16 exports. New people: Ryan Ebzery (2015-16) — a 14th manager. */
    "furher goodell": "Hurd",
    "mr. flee flee fleeeeener": "CC",
    "tucker right in the pussy": "Wolff",
    "help please help": "Ebzery",
    "i had a dog his name was jimmy": "Hurd",
    "frank's whores": "CC",
    "i'm fucked": "Ebzery",
    "what can browns do for jews": "Wolff",
    /* 2015-16 exports. New people: Ryan Ebzery (2015-16) — a 14th manager. */
    "eye of the jeu": "Wolff",
    "london silly willies": "CC",
    /* 2013/14/17 exports. New: Brad Kitchen (2013-14) — a 15th manager. */
    "mike hawksuge hawksuge": "Ebzery",
    "weggie rayne": "CC",
    "jamm boys": "Buley",
    "cutty-marshall alldaybaby": "Gotch",
    "dow jones": "Woods",
    "kitchen sink": "Kitchen",
    "hugh junions": "Christel",
    "mike hunthurts hunthurts": "Ebzery",
    "wreck it ray": "Wolff",
    "hoyer... fornicator": "Hurd",
    "baltimore stand up": "Gotch",
    "kitchens hammer": "Kitchen",
    "dez-ed and confused": "Woods",
    "billy breathes": "Hurd",
    "shady (acl) crack cooks": "CC",   // ESPN owner page shortens it to "Crack Cooks"
    /* 2019 + 2024 exports — the last two seasons without an owner column. */
    "de'coldest toevadoit": "CC",
    "my chubb always fitz": "Wolff",
    "jefferson airplane": "Riz",
    "puka atta adonai": "Wolff",
    "brown n' white catholic chubbs": "CC",
    // 2025 Sleeper handles
    'jmcd6': 'McD', 'gotch118': 'Gotch', 'morning_woods': 'Woods',
    'wolffj10': 'Wolff', 'cheeky_clapz': 'Hyman', 'samrizz': 'Riz',
    'slempw92': 'Slemp', 'thecaptaincc': 'CC', 'aarrogantfraudg': 'Hurd',
    'buleyn14': 'Buley', 'schristel26': 'Christel',
    'bonjiles': 'Zach',        // by elimination — the only manager left unhandled
  };

  const CUMBOWL = [
    { yr: 2023, s12: 'Mooney Tunes',        p12: 108.8, s11: 'Slob on my Cobb',      p11: 84.9 },
    { yr: 2022, s12: 'Slob on my Cobb',     p12: 108.9, s11: 'London Silly Willies', p11: 92.6 },
    { yr: 2021, s12: 'Pepperoni TDs',       p12: 71.0,  s11: 'Death Dont Hurts Very Long', p11: 106.4 },
    { yr: 2024, s12: 'Gregs Morning Dew Dew', p12: 97.7, s11: 'Mortal Wombats', p11: 153.6 },
    { yr: 2025, s12: 'schristel26', p12: 107.42, s11: 'buleyn14', p11: 105.06, recon: true },
    { yr: 2020, s12: 'Big Dick Nick',       p12: 108.1, s11: 'Aarrogant Fraudgers',  p11: 67.1 },
    { yr: 2019, s12: 'Colonel Foreskins',   p12: 103.7, s11: 'My Chubb Always Fitz', p11: 126.2 },
    { yr: 2018, s12: 'Slob on my Cobb',     p12: 114.0, s11: 'Whipits Rule',         p11: 103.0 },
    { yr: 2017, s12: 'Greggs Morning Dew Dew', p12: 105.6, s11: 'Mortal Wombats',  p11: 96.1 },
    { yr: 2016, s12: "I'm Fucked",             p12: 79.3,  s11: 'Mortal Wombats',  p11: 80.4 },
    { yr: 2015, s12: 'Help Please Help',       p12: 88.0,  s11: "Greg's Father",   p11: 123.7 },
    { yr: 2014, s12: 'Dez-ed and Confused',    p12: 54.7,  s11: 'Jamm Boys',       p11: 83.4 },
    { yr: 2013, s12: 'Hugh Junions',           p12: 75.8,  s11: 'Dow Jones',       p11: 77.4 },
  ];


  /* ── PLAYOFF GAMES ─────────────────────────────────────────────────────────
     Every game from the four ESPN playoff brackets the owner exported (2021-24).
     br: W = winner's bracket · WC = winner's consolation ladder (places 4-6)
     C = consolation ladder, GmC1-9 (places 7-12; GmC3 is the Cum Bowl).
     ⚠️ Names are the FULL names resolved against each season's standings —
     ESPN truncates them with "…" in the bracket view. */
  const PLAYOFF_GAMES = [
    /* ── 2025, the Sleeper season (v57) ────────────────────────────────
       From the owner's own Sleeper bracket. ⚠️ Sleeper shows TWO numbers per
       team — the actual score in bold and its PROJECTION in grey under it.
       These are the actual ones, and the check that says so is the final:
       124.04-107.28 is what `SEASON[2025].final` has held by hand since v1.
       ⚠️ WINNER'S BRACKET ONLY. The 3rd- and 5th-place games were below the
       fold of the capture and the consolation ladder is not on that screen at
       all, so 2025 has no `WC` or `C` games. That is why `MEET` is smaller
       here than for an ESPN season — stated rather than papered over.
       ⚠️ The 2025 FINAL now lives here, so the `s2.final` reconstruction
       below no longer fires for it: `seen` is keyed on year + the pair, and
       that dedupe is what stops one game being counted twice. */
    { yr: 2025, br: "W", rd: "R1", a: "Morning_Woods", as: 132, b: "wolffj10", bs: 104 },
    { yr: 2025, br: "W", rd: "R1", a: "Cheeky_Clapz", as: 193.48, b: "BonJiles", bs: 68.26 },
    { yr: 2025, br: "W", rd: "R2", a: "JMcD6", as: 96.5, b: "Morning_Woods", bs: 96.2 },
    { yr: 2025, br: "W", rd: "R2", a: "Gotch118", as: 100.4, b: "Cheeky_Clapz", bs: 108.68 },
    { yr: 2025, br: "W", rd: "FINAL", a: "JMcD6", as: 124.04, b: "Cheeky_Clapz", bs: 107.28 },
    { yr: 2024, br: "W", rd: "R1", a: "Pepperoni TDs", as: 95.8, b: "Death Dont Hurts Very Long", bs: 98.3 },
    { yr: 2024, br: "W", rd: "R1", a: "Jared Goff Hits Women", as: 131.4, b: "Morning Woods", bs: 109.4 },
    { yr: 2024, br: "W", rd: "R2", a: "Death Dont Hurts Very Long", as: 133.9, b: "Thurgood Marshall", bs: 135.5 },
    { yr: 2024, br: "W", rd: "R2", a: "Jared Goff Hits Women", as: 114, b: "Slob on my Cobb", bs: 101.6 },
    { yr: 2024, br: "W", rd: "FINAL", a: "Jared Goff Hits Women", as: 73.4, b: "Thurgood Marshall", bs: 89.8 },
    { yr: 2024, br: "WC", rd: "", a: "Pepperoni TDs", as: 84.3, b: "Morning Woods", bs: 139.5 },
    { yr: 2024, br: "WC", rd: "", a: "Death Dont Hurts Very Long", as: 120.5, b: "Slob on my Cobb", bs: 132.5 },
    { yr: 2024, br: "WC", rd: "", a: "Pepperoni TDs", as: 111, b: "Morning Woods", bs: 112.1 },
    { yr: 2024, br: "C", rd: "GmC1", a: "Brown N' White Catholic Chubbs", as: 121, b: "Puka Atta Adonai", bs: 143.6 },
    { yr: 2024, br: "C", rd: "GmC2", a: "Jefferson Airplane", as: 115.5, b: "Aarogant Fraudgers", bs: 97.9 },
    { yr: 2024, br: "C", rd: "GmC3", a: "Gregs Morning Dew Dew", as: 97.7, b: "Mortal Wombats", bs: 153.6 },
    { yr: 2024, br: "C", rd: "GmC4", a: "Jefferson Airplane", as: 108.3, b: "Puka Atta Adonai", bs: 96.2 },
    { yr: 2024, br: "C", rd: "GmC5", a: "Mortal Wombats", as: 128.9, b: "Brown N' White Catholic Chubbs", bs: 94 },
    { yr: 2024, br: "C", rd: "GmC6", a: "Gregs Morning Dew Dew", as: 96.8, b: "Aarogant Fraudgers", bs: 98.4 },
    { yr: 2024, br: "C", rd: "GmC7", a: "Mortal Wombats", as: 57.5, b: "Jefferson Airplane", bs: 153.3 },
    { yr: 2024, br: "C", rd: "GmC8", a: "Aarogant Fraudgers", as: 100.8, b: "Puka Atta Adonai", bs: 131.8 },
    { yr: 2024, br: "C", rd: "GmC9", a: "Gregs Morning Dew Dew", as: 99.3, b: "Brown N' White Catholic Chubbs", bs: 92.1 },
    { yr: 2023, br: "W", rd: "R1", a: "Morning Woods", as: 69.5, b: "Death Dont Hurts Very Long", bs: 125.8 },
    { yr: 2023, br: "W", rd: "R1", a: "Gregs Morning Dew Dew", as: 108.1, b: "Mortal Wombats", bs: 102.9 },
    { yr: 2023, br: "W", rd: "R2", a: "Death Dont Hurts Very Long", as: 79.1, b: "Burrow My Johnson'In Her Pitts", bs: 105.1 },
    { yr: 2023, br: "W", rd: "R2", a: "Gregs Morning Dew Dew", as: 149.5, b: "Aarogant Fraudgers", bs: 88.5 },
    { yr: 2023, br: "W", rd: "FINAL", a: "Gregs Morning Dew Dew", as: 114.2, b: "Burrow My Johnson'In Her Pitts", bs: 100.6 },
    { yr: 2023, br: "WC", rd: "", a: "Morning Woods", as: 117.5, b: "Mortal Wombats", bs: 107.3 },
    { yr: 2023, br: "WC", rd: "", a: "Death Dont Hurts Very Long", as: 163.7, b: "Aarogant Fraudgers", bs: 89.4 },
    { yr: 2023, br: "WC", rd: "", a: "Morning Woods", as: 122.4, b: "Mortal Wombats", bs: 132.6 },
    { yr: 2023, br: "C", rd: "GmC1", a: "Football Team", as: 92.5, b: "Giants fkng suck", bs: 61.3 },
    { yr: 2023, br: "C", rd: "GmC2", a: "Ja' Marrma Dance", as: 85, b: "Pepperoni TDs", bs: 90.8 },
    { yr: 2023, br: "C", rd: "GmC3", a: "Mooney Tunes", as: 108.8, b: "Slob on my Cobb", bs: 84.9 },
    { yr: 2023, br: "C", rd: "GmC4", a: "Pepperoni TDs", as: 80.2, b: "Football Team", bs: 114.9 },
    { yr: 2023, br: "C", rd: "GmC5", a: "Mooney Tunes", as: 93.1, b: "Giants fkng suck", bs: 90 },
    { yr: 2023, br: "C", rd: "GmC6", a: "Slob on my Cobb", as: 82.8, b: "Ja' Marrma Dance", bs: 74.2 },
    { yr: 2023, br: "C", rd: "GmC7", a: "Mooney Tunes", as: 87.4, b: "Football Team", bs: 72.6 },
    { yr: 2023, br: "C", rd: "GmC8", a: "Slob on my Cobb", as: 69.5, b: "Pepperoni TDs", bs: 118.3 },
    { yr: 2023, br: "C", rd: "GmC9", a: "Ja' Marrma Dance", as: 74.3, b: "Giants fkng suck", bs: 106.2 },
    { yr: 2022, br: "W", rd: "R1", a: "Death Dont Hurts Very Long", as: 140.2, b: "Morning Woods", bs: 95.4 },
    { yr: 2022, br: "W", rd: "R1", a: "Eye of the Jeu", as: 90.2, b: "Pepperoni TDs", bs: 109 },
    { yr: 2022, br: "W", rd: "R2", a: "Death Dont Hurts Very Long", as: 135.2, b: "Ja' Marrma Dance", bs: 103.8 },
    { yr: 2022, br: "W", rd: "R2", a: "Pepperoni TDs", as: 123.4, b: "Gregs Morning Dew Dew", bs: 67.3 },
    { yr: 2022, br: "W", rd: "FINAL", a: "Death Dont Hurts Very Long", as: 114.1, b: "Pepperoni TDs", bs: 99.1 },
    { yr: 2022, br: "WC", rd: "", a: "Eye of the Jeu", as: 92.8, b: "Morning Woods", bs: 114.8 },
    { yr: 2022, br: "WC", rd: "", a: "Gregs Morning Dew Dew", as: 81.7, b: "Ja' Marrma Dance", bs: 65.6 },
    { yr: 2022, br: "WC", rd: "", a: "Eye of the Jeu", as: 64.3, b: "Morning Woods", bs: 73.7 },
    { yr: 2022, br: "C", rd: "GmC1", a: "Mortal Wombats", as: 93.6, b: "Football Team", bs: 96 },
    { yr: 2022, br: "C", rd: "GmC2", a: "Return Of The Mac", as: 82.5, b: "Run DM, See?", bs: 126.5 },
    { yr: 2022, br: "C", rd: "GmC3", a: "Slob on my Cobb", as: 108.9, b: "London Silly Willies", bs: 92.6 },
    { yr: 2022, br: "C", rd: "GmC4", a: "Run DM, See?", as: 86, b: "Football Team", bs: 112.3 },
    { yr: 2022, br: "C", rd: "GmC5", a: "Slob on my Cobb", as: 127.5, b: "Mortal Wombats", bs: 144 },
    { yr: 2022, br: "C", rd: "GmC6", a: "London Silly Willies", as: 105.9, b: "Return Of The Mac", bs: 80.4 },
    { yr: 2022, br: "C", rd: "GmC7", a: "Mortal Wombats", as: 89.6, b: "Football Team", bs: 127.2 },
    { yr: 2022, br: "C", rd: "GmC8", a: "London Silly Willies", as: 95.6, b: "Run DM, See?", bs: 126.3 },
    { yr: 2022, br: "C", rd: "GmC9", a: "Slob on my Cobb", as: 91.5, b: "Return Of The Mac", bs: 72 },
    { yr: 2021, br: "W", rd: "R1", a: "Slob on my Cobb", as: 97.6, b: "Mortal Wombats", bs: 74.9 },
    { yr: 2021, br: "W", rd: "R1", a: "Godwins If Hes Thelan a Sermon", as: 88.6, b: "Return Of The Mac", bs: 94.6 },
    { yr: 2021, br: "W", rd: "R2", a: "Slob on my Cobb", as: 132.2, b: "Hill Top Hoods", bs: 122.5 },
    { yr: 2021, br: "W", rd: "R2", a: "Return Of The Mac", as: 118.2, b: "Alvin and the Shitmonks", bs: 102.7 },
    { yr: 2021, br: "W", rd: "FINAL", a: "Slob on my Cobb", as: 120.5, b: "Return Of The Mac", bs: 110.7 },
    { yr: 2021, br: "WC", rd: "", a: "Godwins If Hes Thelan a Sermon", as: 113.9, b: "Mortal Wombats", bs: 55.6 },
    { yr: 2021, br: "WC", rd: "", a: "Alvin and the Shitmonks", as: 126.4, b: "Hill Top Hoods", bs: 184.7 },
    { yr: 2021, br: "WC", rd: "", a: "Godwins If Hes Thelan a Sermon", as: 120.8, b: "Mortal Wombats", bs: 91.4 },
    { yr: 2021, br: "C", rd: "GmC1", a: "Run DM, See?", as: 115, b: "Football Team", bs: 72.7 },
    { yr: 2021, br: "C", rd: "GmC2", a: "Jam Boys", as: 72.8, b: "Morning Woods", bs: 94.6 },
    { yr: 2021, br: "C", rd: "GmC3", a: "Pepperoni TDs", as: 71, b: "Death Dont Hurts Very Long", bs: 106.4 },
    { yr: 2021, br: "C", rd: "GmC4", a: "Morning Woods", as: 98.9, b: "Run DM, See?", bs: 112.4 },
    { yr: 2021, br: "C", rd: "GmC5", a: "Death Dont Hurts Very Long", as: 99.5, b: "Football Team", bs: 97.8 },
    { yr: 2021, br: "C", rd: "GmC6", a: "Pepperoni TDs", as: 84.4, b: "Jam Boys", bs: 84.6 },
    { yr: 2021, br: "C", rd: "GmC7", a: "Death Dont Hurts Very Long", as: 66.4, b: "Run DM, See?", bs: 102.6 },
    { yr: 2021, br: "C", rd: "GmC8", a: "Jam Boys", as: 78.6, b: "Morning Woods", bs: 106.1 },
    { yr: 2021, br: "C", rd: "GmC9", a: "Pepperoni TDs", as: 55.9, b: "Football Team", bs: 99 },
    { yr: 2020, br: "W", rd: "R1", a: "Death Hurts", as: 116.7, b: "Mortal Wombats", bs: 67.6 },
    { yr: 2020, br: "W", rd: "R1", a: "Pepperoni TDs", as: 120.1, b: "Hill Top Hoods", bs: 131.2 },
    { yr: 2020, br: "W", rd: "R2", a: "Death Hurts", as: 153.8, b: "Alvin and the Shitmonks", bs: 144.2 },
    { yr: 2020, br: "W", rd: "R2", a: "Hill Top Hoods", as: 110.5, b: "Morning Woods", bs: 111.9 },
    { yr: 2020, br: "W", rd: "FINAL", a: "Death Hurts", as: 94.5, b: "Morning Woods", bs: 163.1 },
    { yr: 2020, br: "WC", rd: "", a: "Pepperoni TDs", as: 109.2, b: "Mortal Wombats", bs: 114.3 },
    { yr: 2020, br: "WC", rd: "", a: "Hill Top Hoods", as: 91.6, b: "Alvin and the Shitmonks", bs: 142.4 },
    { yr: 2020, br: "WC", rd: "", a: "Pepperoni TDs", as: 125, b: "Mortal Wombats", bs: 142.3 },
    { yr: 2020, br: "C", rd: "GmC1", a: "Colonel Foreskins", as: 46.9, b: "The Knee Grows Football Team", bs: 145.6 },
    { yr: 2020, br: "C", rd: "GmC2", a: "Slob on my Cobb", as: 124.3, b: "Fresh Prince Of Hel-Aire", bs: 82 },
    { yr: 2020, br: "C", rd: "GmC3", a: "Big Dick Nick", as: 108.1, b: "Aarrogant Fraudgers", bs: 67.1 },
    { yr: 2020, br: "C", rd: "GmC4", a: "Slob on my Cobb", as: 107.6, b: "The Knee Grows Football Team", bs: 94.6 },
    { yr: 2020, br: "C", rd: "GmC5", a: "Big Dick Nick", as: 82, b: "Colonel Foreskins", bs: 80.7 },
    { yr: 2020, br: "C", rd: "GmC6", a: "Aarrogant Fraudgers", as: 125.1, b: "Fresh Prince Of Hel-Aire", bs: 88.7 },
    { yr: 2020, br: "C", rd: "GmC7", a: "Big Dick Nick", as: 89.6, b: "Slob on my Cobb", bs: 78 },
    { yr: 2020, br: "C", rd: "GmC8", a: "Aarrogant Fraudgers", as: 109.8, b: "The Knee Grows Football Team", bs: 119.7 },
    { yr: 2020, br: "C", rd: "GmC9", a: "Fresh Prince Of Hel-Aire", as: 70.2, b: "Colonel Foreskins", bs: 110.6 },
    { yr: 2019, br: "W", rd: "R1", a: "Smoke a Bowe, Drink a Forte", as: 131.2, b: "Mortal Wombats", bs: 105.2 },
    { yr: 2019, br: "W", rd: "R1", a: "Slob on my Cobb", as: 94.9, b: "Morning Woods", bs: 110.5 },
    { yr: 2019, br: "W", rd: "R2", a: "Smoke a Bowe, Drink a Forte", as: 100.6, b: "Pepperoni TDs", bs: 149.2 },
    { yr: 2019, br: "W", rd: "R2", a: "Morning Woods", as: 162, b: "My Knee Grows", bs: 106.2 },
    { yr: 2019, br: "W", rd: "FINAL", a: "Morning Woods", as: 102.1, b: "Pepperoni TDs", bs: 140.8 },
    { yr: 2019, br: "WC", rd: "", a: "Slob on my Cobb", as: 80.4, b: "Mortal Wombats", bs: 101 },
    { yr: 2019, br: "WC", rd: "", a: "Smoke a Bowe, Drink a Forte", as: 72.3, b: "My Knee Grows", bs: 90 },
    { yr: 2019, br: "WC", rd: "", a: "Slob on my Cobb", as: 87.4, b: "Mortal Wombats", bs: 121.6 },
    { yr: 2019, br: "C", rd: "GmC1", a: "De'Coldest ToEvadoit", as: 121.9, b: "Aarrogant Fraudgers", bs: 100.5 },
    { yr: 2019, br: "C", rd: "GmC2", a: "Hill Top Hoods", as: 99.7, b: "The Great Wentz", bs: 105.4 },
    { yr: 2019, br: "C", rd: "GmC3", a: "Colonel Foreskins", as: 103.7, b: "My Chubb Always Fitz", bs: 126.2 },
    { yr: 2019, br: "C", rd: "GmC4", a: "The Great Wentz", as: 124.8, b: "De'Coldest ToEvadoit", bs: 129.7 },
    { yr: 2019, br: "C", rd: "GmC5", a: "My Chubb Always Fitz", as: 153.9, b: "Aarrogant Fraudgers", bs: 72.2 },
    { yr: 2019, br: "C", rd: "GmC6", a: "Colonel Foreskins", as: 75.2, b: "Hill Top Hoods", bs: 98.5 },
    { yr: 2019, br: "C", rd: "GmC7", a: "My Chubb Always Fitz", as: 83.6, b: "De'Coldest ToEvadoit", bs: 149.1 },
    { yr: 2019, br: "C", rd: "GmC8", a: "Hill Top Hoods", as: 104.8, b: "The Great Wentz", bs: 92.9 },
    { yr: 2019, br: "C", rd: "GmC9", a: "Colonel Foreskins", as: 82.6, b: "Aarrogant Fraudgers", bs: 48.4 },
    { yr: 2018, br: "W", rd: "R1", a: "Mortal Wombats", as: 183.3, b: "Cook'n up Grahams", bs: 119.1 },
    { yr: 2018, br: "W", rd: "R1", a: "The Great Wentz", as: 90.2, b: "Soft Hands Rough Handys", bs: 61.2 },
    { yr: 2018, br: "W", rd: "R2", a: "Mortal Wombats", as: 73.2, b: "Smoke a Bowe, Drink a Forte", bs: 77.4 },
    { yr: 2018, br: "W", rd: "R2", a: "The Great Wentz", as: 97.3, b: "Aarrogant Fraudgers", bs: 92.7 },
    { yr: 2018, br: "W", rd: "FINAL", a: "The Great Wentz", as: 134.2, b: "Smoke a Bowe, Drink a Forte", bs: 117.7 },
    { yr: 2018, br: "WC", rd: "", a: "Cook'n up Grahams", as: 139, b: "Soft Hands Rough Handys", bs: 111.6 },
    { yr: 2018, br: "WC", rd: "", a: "Mortal Wombats", as: 101.6, b: "Aarrogant Fraudgers", bs: 140.5 },
    { yr: 2018, br: "WC", rd: "", a: "Cook'n up Grahams", as: 101.6, b: "Soft Hands Rough Handys", bs: 98.5 },
    { yr: 2018, br: "C", rd: "GmC1", a: "My Knee Grows", as: 98.8, b: "Pepperoni TDs", bs: 96.7 },
    { yr: 2018, br: "C", rd: "GmC2", a: "Morning Woods", as: 85.4, b: "Greg's Pirate Daddy", bs: 84.3 },
    { yr: 2018, br: "C", rd: "GmC3", a: "Slob on my Cobb", as: 114, b: "Whipits Rule", bs: 103 },
    { yr: 2018, br: "C", rd: "GmC4", a: "Greg's Pirate Daddy", as: 55.9, b: "My Knee Grows", bs: 115.5 },
    { yr: 2018, br: "C", rd: "GmC5", a: "Slob on my Cobb", as: 96.8, b: "Pepperoni TDs", bs: 103 },
    { yr: 2018, br: "C", rd: "GmC6", a: "Whipits Rule", as: 74.5, b: "Morning Woods", bs: 92.7 },
    { yr: 2018, br: "C", rd: "GmC7", a: "My Knee Grows", as: 101.1, b: "Pepperoni TDs", bs: 121.3 },
    { yr: 2018, br: "C", rd: "GmC8", a: "Morning Woods", as: 107.7, b: "Greg's Pirate Daddy", bs: 93.4 },
    { yr: 2018, br: "C", rd: "GmC9", a: "Slob on my Cobb", as: 104.7, b: "Whipits Rule", bs: 99.7 },
    /* ── 2013-17, added in v54 ─────────────────────────────────────────
       From the owner's own ESPN "Final Playoff Results" captures — the
       five seasons whose bracket tab had never been opened. Parsed by
       COORDINATE, not off a flat text dump: the page is three columns and
       a text extraction interleaves them, so every pairing would have been
       a guess. Cross-checked against this archive before being trusted —
       see the v54 entry in CLAUDE.md. */
    { yr: 2017, br: "W", rd: "R1", a: "The Great Wentz", as: 110.5, b: "What Can Browns Do For Jews", bs: 119 },
    { yr: 2017, br: "W", rd: "R1", a: "Shady (ACL) Crack Cooks", as: 74, b: "Pepperoni TD's", bs: 69.6 },
    { yr: 2017, br: "W", rd: "R2", a: "What Can Browns Do For Jews", as: 75.4, b: "My Knee Grows", bs: 76.4 },
    { yr: 2017, br: "W", rd: "R2", a: "Shady (ACL) Crack Cooks", as: 77.9, b: "Morning Woods", bs: 163.6 },
    { yr: 2017, br: "W", rd: "FINAL", a: "Morning Woods", as: 141.5, b: "My Knee Grows", bs: 89.1 },
    { yr: 2017, br: "WC", rd: "", a: "The Great Wentz", as: 137.5, b: "Pepperoni TD's", bs: 117.3 },
    { yr: 2017, br: "WC", rd: "", a: "Shady (ACL) Crack Cooks", as: 77.1, b: "What Can Browns Do For Jews", bs: 76.5 },
    { yr: 2017, br: "WC", rd: "", a: "The Great Wentz", as: 93.4, b: "Pepperoni TD's", bs: 111.6 },
    { yr: 2017, br: "C", rd: "GmC1", a: "Smoke a Bowe, Drink a Forte", as: 78.2, b: "Greg's Father", bs: 131 },
    { yr: 2017, br: "C", rd: "GmC2", a: "Billy Breathes", as: 122.9, b: "Slob on my Cobb", bs: 111 },
    { yr: 2017, br: "C", rd: "GmC3", a: "Greggs Morning Dew Dew", as: 105.6, b: "Mortal Wombats", bs: 96.1 },
    { yr: 2017, br: "C", rd: "GmC4", a: "Billy Breathes", as: 72.4, b: "Greg's Father", bs: 142.9 },
    { yr: 2017, br: "C", rd: "GmC5", a: "Greggs Morning Dew Dew", as: 97.8, b: "Smoke a Bowe, Drink a Forte", bs: 99.8 },
    { yr: 2017, br: "C", rd: "GmC6", a: "Mortal Wombats", as: 75.6, b: "Slob on my Cobb", bs: 93.6 },
    { yr: 2017, br: "C", rd: "GmC7", a: "Smoke a Bowe, Drink a Forte", as: 84.2, b: "Greg's Father", bs: 87.6 },
    { yr: 2017, br: "C", rd: "GmC8", a: "Billy Breathes", as: 89.5, b: "Slob on my Cobb", bs: 65.4 },
    { yr: 2017, br: "C", rd: "GmC9", a: "Greggs Morning Dew Dew", as: 88.8, b: "Mortal Wombats", bs: 80.8 },
    { yr: 2016, br: "W", rd: "R1", a: "My Knee Grows", as: 76.9, b: "Greg's Father", bs: 102.3 },
    { yr: 2016, br: "W", rd: "R1", a: "Frank's Whores", as: 63.9, b: "Smoke a Bowe, Drink a Forte", bs: 110.1 },
    { yr: 2016, br: "W", rd: "R2", a: "Greg's Father", as: 109.9, b: "I Had a Dog His Name Was Jimmy", bs: 93.4 },
    { yr: 2016, br: "W", rd: "R2", a: "Smoke a Bowe, Drink a Forte", as: 85.3, b: "Air Cunt", bs: 86.6 },
    { yr: 2016, br: "W", rd: "FINAL", a: "Greg's Father", as: 89.4, b: "Air Cunt", bs: 126 },
    { yr: 2016, br: "WC", rd: "", a: "Frank's Whores", as: 76.2, b: "My Knee Grows", bs: 99.4 },
    { yr: 2016, br: "WC", rd: "", a: "Smoke a Bowe, Drink a Forte", as: 96.7, b: "I Had a Dog His Name Was Jimmy", bs: 104.7 },
    { yr: 2016, br: "WC", rd: "", a: "Frank's Whores", as: 81.7, b: "My Knee Grows", bs: 83.7 },
    { yr: 2016, br: "C", rd: "GmC1", a: "Slob on my Cobb", as: 63.1, b: "What Can Browns Do For Jews", bs: 43.2 },
    { yr: 2016, br: "C", rd: "GmC2", a: "Gregs Morning Dew Dew", as: 73.1, b: "Jim Crow All-Stars", bs: 76.9 },
    { yr: 2016, br: "C", rd: "GmC3", a: "I'm Fucked", as: 79.3, b: "Mortal Wombats", bs: 80.4 },
    { yr: 2016, br: "C", rd: "GmC4", a: "Jim Crow All-Stars", as: 74.4, b: "Slob on my Cobb", bs: 134 },
    { yr: 2016, br: "C", rd: "GmC5", a: "Mortal Wombats", as: 74.7, b: "What Can Browns Do For Jews", bs: 43.3 },
    { yr: 2016, br: "C", rd: "GmC6", a: "I'm Fucked", as: 64.7, b: "Gregs Morning Dew Dew", bs: 63 },
    { yr: 2016, br: "C", rd: "GmC7", a: "Mortal Wombats", as: 72.5, b: "Slob on my Cobb", bs: 75.6 },
    { yr: 2016, br: "C", rd: "GmC8", a: "I'm Fucked", as: 86.7, b: "Jim Crow All-Stars", bs: 112.1 },
    { yr: 2016, br: "C", rd: "GmC9", a: "Gregs Morning Dew Dew", as: 64.6, b: "What Can Browns Do For Jews", bs: 54.7 },
    { yr: 2015, br: "W", rd: "R1", a: "Jim Crow All-Stars", as: 97.6, b: "Gregs Morning Dew Dew", bs: 66 },
    { yr: 2015, br: "W", rd: "R1", a: "Mr. Flee Flee Fleeeeener", as: 54.9, b: "My Knee Grows", bs: 95.8 },
    { yr: 2015, br: "W", rd: "R2", a: "Jim Crow All-Stars", as: 118.9, b: "The Bash Brothers", bs: 109.1 },
    { yr: 2015, br: "W", rd: "R2", a: "My Knee Grows", as: 78.4, b: "Furher Goodell", bs: 130.5 },
    { yr: 2015, br: "W", rd: "FINAL", a: "Jim Crow All-Stars", as: 107.2, b: "Furher Goodell", bs: 95.5 },
    { yr: 2015, br: "WC", rd: "", a: "Mr. Flee Flee Fleeeeener", as: 87.6, b: "Gregs Morning Dew Dew", bs: 79.5 },
    { yr: 2015, br: "WC", rd: "", a: "My Knee Grows", as: 106.2, b: "The Bash Brothers", bs: 105.8 },
    { yr: 2015, br: "WC", rd: "", a: "Mr. Flee Flee Fleeeeener", as: 97.7, b: "Gregs Morning Dew Dew", bs: 77.4 },
    { yr: 2015, br: "C", rd: "GmC1", a: "Smoke a Bowe, Drink a Forte", as: 64.9, b: "Immortal Wombats", bs: 85.9 },
    { yr: 2015, br: "C", rd: "GmC2", a: "Slob on my Cobb", as: 71.4, b: "Tucker Right In The Pussy", bs: 91.7 },
    { yr: 2015, br: "C", rd: "GmC3", a: "Help Please Help", as: 88, b: "Greg's Father", bs: 123.7 },
    { yr: 2015, br: "C", rd: "GmC4", a: "Tucker Right In The Pussy", as: 107.9, b: "Immortal Wombats", bs: 105.7 },
    { yr: 2015, br: "C", rd: "GmC5", a: "Greg's Father", as: 83.9, b: "Smoke a Bowe, Drink a Forte", bs: 87.5 },
    { yr: 2015, br: "C", rd: "GmC6", a: "Help Please Help", as: 85.5, b: "Slob on my Cobb", bs: 122.9 },
    { yr: 2015, br: "C", rd: "GmC7", a: "Tucker Right In The Pussy", as: 91.2, b: "Smoke a Bowe, Drink a Forte", bs: 52.5 },
    { yr: 2015, br: "C", rd: "GmC8", a: "Slob on my Cobb", as: 109.1, b: "Immortal Wombats", bs: 86.3 },
    { yr: 2015, br: "C", rd: "GmC9", a: "Help Please Help", as: 95.3, b: "Greg's Father", bs: 83.2 },
    { yr: 2014, br: "W", rd: "R1", a: "Slob on my Cobb", as: 106, b: "Buley is Greek", bs: 84.5 },
    { yr: 2014, br: "W", rd: "R1", a: "Mike Hunthurts hunthurts", as: 115.8, b: "Hoyer... Fornicator", bs: 113.3 },
    { yr: 2014, br: "W", rd: "R2", a: "Slob on my Cobb", as: 101.6, b: "wreck it Ray", bs: 92.3 },
    { yr: 2014, br: "W", rd: "R2", a: "Mike Hunthurts hunthurts", as: 78.9, b: "My Knee Grows", bs: 76.7 },
    { yr: 2014, br: "W", rd: "FINAL", a: "Mike Hunthurts hunthurts", as: 67.2, b: "Slob on my Cobb", bs: 114.9 },
    { yr: 2014, br: "WC", rd: "", a: "Buley is Greek", as: 75.8, b: "Hoyer... Fornicator", bs: 86 },
    { yr: 2014, br: "WC", rd: "", a: "My Knee Grows", as: 64.8, b: "wreck it Ray", bs: 125.2 },
    { yr: 2014, br: "WC", rd: "", a: "Buley is Greek", as: 89.9, b: "Hoyer... Fornicator", bs: 59.4 },
    { yr: 2014, br: "C", rd: "GmC1", a: "BALTIMORE STAND UP", as: 85.7, b: "Weggie Rayne", bs: 73.8 },
    { yr: 2014, br: "C", rd: "GmC2", a: "Hugh Junions", as: 105, b: "Kitchens Hammer", bs: 107.5 },
    { yr: 2014, br: "C", rd: "GmC3", a: "Dez-ed and Confused", as: 54.7, b: "Jamm Boys", bs: 83.4 },
    { yr: 2014, br: "C", rd: "GmC4", a: "Kitchens Hammer", as: 48, b: "BALTIMORE STAND UP", bs: 66.7 },
    { yr: 2014, br: "C", rd: "GmC5", a: "Jamm Boys", as: 78.2, b: "Weggie Rayne", bs: 119.8 },
    { yr: 2014, br: "C", rd: "GmC6", a: "Dez-ed and Confused", as: 82.4, b: "Hugh Junions", bs: 91.4 },
    { yr: 2014, br: "C", rd: "GmC7", a: "BALTIMORE STAND UP", as: 61.1, b: "Weggie Rayne", bs: 90.5 },
    { yr: 2014, br: "C", rd: "GmC8", a: "Hugh Junions", as: 102, b: "Kitchens Hammer", bs: 61.7 },
    { yr: 2014, br: "C", rd: "GmC9", a: "Dez-ed and Confused", as: 73.4, b: "Jamm Boys", bs: 107.7 },
    { yr: 2013, br: "W", rd: "R1", a: "Slob on my Cobb", as: 130.5, b: "Cutty-Marshall ALLDAYBABY", bs: 112.1 },
    { yr: 2013, br: "W", rd: "R1", a: "Mike Hawksuge hawksuge", as: 119.2, b: "Christels Mattress", bs: 102.2 },
    { yr: 2013, br: "W", rd: "R2", a: "Slob on my Cobb", as: 124.1, b: "Jamm Boys", bs: 112.1 },
    { yr: 2013, br: "W", rd: "R2", a: "Mike Hawksuge hawksuge", as: 103.5, b: "Weggie Rayne", bs: 77.9 },
    { yr: 2013, br: "W", rd: "FINAL", a: "Mike Hawksuge hawksuge", as: 89.2, b: "Slob on my Cobb", bs: 124.7 },
    { yr: 2013, br: "WC", rd: "", a: "Cutty-Marshall ALLDAYBABY", as: 95.9, b: "Christels Mattress", bs: 118.2 },
    { yr: 2013, br: "WC", rd: "", a: "Weggie Rayne", as: 130, b: "Jamm Boys", bs: 107.3 },
    { yr: 2013, br: "WC", rd: "", a: "Cutty-Marshall ALLDAYBABY", as: 97.1, b: "Christels Mattress", bs: 83.9 },
    { yr: 2013, br: "C", rd: "GmC1", a: "Team Wolff", as: 65.5, b: "Kitchen Sink", bs: 117.1 },
    { yr: 2013, br: "C", rd: "GmC2", a: "Slemp The Man Whore", as: 100.7, b: "My Knee Grows", bs: 65.6 },
    { yr: 2013, br: "C", rd: "GmC3", a: "Hugh Junions", as: 75.8, b: "Dow Jones", bs: 77.4 },
    { yr: 2013, br: "C", rd: "GmC4", a: "Slemp The Man Whore", as: 111, b: "Kitchen Sink", bs: 98.9 },
    { yr: 2013, br: "C", rd: "GmC5", a: "Dow Jones", as: 106.5, b: "Team Wolff", bs: 79.8 },
    { yr: 2013, br: "C", rd: "GmC6", a: "Hugh Junions", as: 79.6, b: "My Knee Grows", bs: 86.4 },
    { yr: 2013, br: "C", rd: "GmC7", a: "Dow Jones", as: 97.5, b: "Slemp The Man Whore", bs: 65.9 },
    { yr: 2013, br: "C", rd: "GmC8", a: "My Knee Grows", as: 45.4, b: "Kitchen Sink", bs: 54.6 },
    { yr: 2013, br: "C", rd: "GmC9", a: "Hugh Junions", as: 123.3, b: "Team Wolff", bs: 62.8 },
  ];

  /* 🚨 EVERY name here is a REAL PERSON'S, and the map is what the twelve of
     them call each other — not a screen name, not a team. In Sports-Hub this
     map hardcoded `McD: 'You'`, because that app had exactly one reader. This
     one has twelve, so 'You' is not a name: it is a ROLE, handed to whoever
     is holding the phone. See `setMe`. */
  const MGR_NAME = { McD: 'McD', Wickman: 'CC', Kitchen: 'Kitchen', Ebzery: 'Ebzery', Slemp: 'Slemp', Woods: 'Woods', Gotch: 'Gotch',
    Buley: 'Buley', Zach: 'Zach', Wolff: 'Wolff', Christel: 'Christel',
    Hyman: 'Hyman', Riz: 'Riz', Hurd: 'Hurd', CC: 'CC' };

  /* Who is reading. `null` until someone picks, and every view is written to
     work with nobody picked — a stranger opening the link still sees the whole
     league, just with no row highlighted and no second person. */
  let ME = null;
  const setMe = (m) => { ME = MGR_NAME[m] ? m : null; };
  const isMe = (m) => !!m && m === ME;
  const MGR_LOGO = { McD: 'mcd', CC: 'cc', Hurd: 'hurd', Hyman: 'hyman',
    Christel: 'christel', Woods: 'woods', Zach: 'zach', Buley: 'buley',
    Wolff: 'wolff', Riz: 'riz', Slemp: 'slemp', Gotch: 'gotch' };
  /* 🏈 Each manager's NFL team, as the mascot on the heading of the page about
     them (v49, owner's call). The 🦅 that was there was HIS team — so every
     one of the other eleven opened their own career page under somebody else's
     bird. The teams are the owner's own answers, manager by manager.
     ⚠️ Keyed by MANAGER CODE, like MGR_LOGO and for the same reason: the
     fantasy team names change every September, the twelve people do not.
     ⚠️ Duplicates are CORRECT — three Jets fans and two Patriots. A mascot
     says who someone roots for, and it was never meant to be unique.
     🚨 The fallback is 👤 and must never be a team. A reader who has picked
     nobody is not an Eagles fan by default, and making one manager's mascot
     the app's own would put the commissioner's team on eleven strangers'
     screens — the same fault `isMe` keeps nearly causing elsewhere. */
  const MGR_TEAM = {
    McD: '🦅',       // Eagles
    Buley: '✈️',     // Jets
    Riz: '✈️',       // Jets
    Woods: '✈️',     // Jets
    CC: '🐴',        // Colts
    /* 🍺 rather than a Patriots mark (v51, owner's call: *"change the pats one
       to 🍺"*). BOTH Patriots managers change, not one: a mascot is per TEAM
       here — three Jets fans share ✈️ — so splitting the pair would read as one
       of them being mis-mapped rather than as a joke. ⚠️ U+1F37A is a single
       codepoint with Emoji_Presentation=Yes, so unlike ✈️ and ⚡️ above it needs
       no variation selector, and unlike 🐦‍⬛ it is not a ZWJ sequence that can
       degrade to two marks. Nothing to guard. */
    Christel: '🍺',  // Patriots
    Hurd: '🍺',      // Patriots
    Gotch: '🐻',     // Bears
    /* ⚠️ Ravens is the one ZWJ sequence here (bird + black square), so it is
       the only glyph that can degrade to a PAIR of marks on a device too old
       to know it. iOS 16.4 and up are fine — every phone in this league — but
       this is the one to swap for 🪶 if anyone ever reports two. */
    Hyman: '🐦‍⬛',    // Ravens
    /* ⚠️ U+26A1 needs the variation selector, exactly as ✈️ above does, or a
       font is free to draw it as a thin monochrome TEXT glyph beside twelve
       colour ones — which is what it did on first render. */
    Slemp: '⚡️',     // Chargers
    Wolff: '🗽',     // Giants
    Zach: '🐆',      // Panthers
  };
  const mascot = (m) => MGR_TEAM[m] || '👤';

  const LH = LEAGUE_HISTORY;
  /* ══════════════════════════════════════════════════════════════════════════
     📜 LEAGUE HISTORY — the stats engine.
     ONE pass over the data producing everything the views read, so no two
     sections can disagree about a number.
     ══════════════════════════════════════════════════════════════════════ */


  const norm = (t) => String(t || '').toLowerCase().trim();
  /* Two managers are deliberately untracked (owner's call). Their SEASONS stay
     in the standings — the standings are the standings — but they carry no
     person, so they never enter a table, a rate or a tally. */
  const EXCLUDE = new Set(['Kitchen', 'Ebzery']);
  const mgrRaw = (t) => HIST_MGR[norm(t)] || '';
  const mgrOf = (t) => { const m = mgrRaw(t); return EXCLUDE.has(m) ? '' : m; };
  const untracked = (t) => !mgrOf(t) && EXCLUDE.has(mgrRaw(t));
  const PO_CUT = 6;                       // top-6 seed always finishes top 6 — verified on all 13 brackets
  /* 🚨 The ONE place second person is decided. Everything downstream — every
     table row, every rivalry line, every caption — reads names through this,
     so pointing it at a different manager re-voices the entire archive with
     no other edit. That is the whole mechanism. */
  const nm = (m) => (isMe(m) ? 'You' : (MGR_NAME[m] || m));
  /* When a sentence needs the NAME even for the reader ("McD has won 3"),
     e.g. a possessive that would read badly as "You's". */
  const realNm = (m) => MGR_NAME[m] || m;
  /* "You HAVE outscored" but "Buley HAS outscored" — second person changes the
     verb, and a sentence that agrees with the wrong person is the first thing
     a reader notices. Every generated sentence about a manager goes through
     this rather than hardcoding one of the two forms. */
  const vb = (m, second, third) => (isMe(m) ? second : third);

  /* A season whose rows are ordered by something OTHER than playoff finish
     cannot award places; only its named champion counts. */
  const isFinal = (s) => s.finalOrder !== false;
  const champRow = (s) => (isFinal(s) ? s.rows[0] : s.rows.find((r) => r.t === s.champ));
  const cbLoser = (c) => (c.p12 > c.p11 ? c.s11 : c.s12);
  const cbWinner = (c) => (c.p12 > c.p11 ? c.s12 : c.s11);
  const CB_LOSER = {}; CUMBOWL.forEach((c) => { CB_LOSER[c.yr] = cbLoser(c); });

  /* ---- per-season derived tables ------------------------------------------ */
  const ppg = (r) => r.pf / (r.w + r.l);
  const SEASON = LH.map((s) => {
    const rows = s.rows.map((r, i) => ({
      ...r, place: isFinal(s) ? i + 1 : null, mgr: mgrOf(r.t), yr: s.yr,
      ppg: ppg(r), papg: r.pa / (r.w + r.l), diff: r.pf - r.pa,
      pct: r.w / (r.w + r.l),
    }));
    /* 🚨 Rank by POINTS and by WINS explicitly. Never rely on array order for a
       tie: the rows arrive in playoff-finish order, so a stable sort silently
       hands "best regular season" to whoever finished best — the v202 fault. */
    const byPF = [...rows].sort((a, b) => b.pf - a.pf);
    byPF.forEach((r, i) => { r.pfRank = i + 1; });
    /* Real seed where known; else wins, then points — never array order. */
    const bySeed = [...rows].sort((a, b) =>
      (a.seed && b.seed ? a.seed - b.seed : 0) || b.pct - a.pct || b.pf - a.pf);
    /* 🚨 `calcSeed` IS A FALLBACK FOR ORDERING ROWS AND IS **NOT** A SEED.
       NOTHING READS IT AND NOTHING SHOULD (v58). Where ESPN published a seed
       it simply echoes it; where it did not — 2013-2017, which have no `seed`
       field at all — it guesses from win% then points, and **that guess is
       measurably wrong**. Checked against the only independent evidence the
       archive has, the bracket's own shape (byes go to seeds 1 and 2, round 1
       is 3v6 and 4v5): it reproduces all 8 seasons that carry a real seed and
       2014/2015/2017, and it FAILS 2013 (the bye went to a 9-4 team with
       FEWER points than the 9-4 team this ranks above it) and 2016 (the bye
       went to an 8-5 team over a 10-3 team). ESPN broke those ties on
       something this archive does not hold.
       ⚠️ So `Seeds & upsets` is restricted to seasons with a REAL seed and
       says so on the card. Wiring this up to "cover all 13 seasons" would
       invent two seasons of seeding and fabricate upsets that never happened
       — the one thing this archive does not do. */
    bySeed.forEach((r, i) => { r.calcSeed = r.seed || i + 1; });
    return { ...s, rows, byPF, bySeed, fin: isFinal(s),
      champ: rows.find((r) => r.t === (champRow(s) || {}).t),
      top: bySeed[0], lgPpg: rows.reduce((a, r) => a + r.ppg, 0) / rows.length };
  });

  /* ---- playoff games ------------------------------------------------------ */
  /* 🚨 Keyed by YEAR+TEAM. Keying on the team name alone and adding it once per
     season row makes a long-lived franchise re-count itself every year. */
  const key = (yr, t) => yr + '\u0000' + t;
  /* 🚨 THE BRACKET WIN-LOSS RECORD IS BACK, UNDER ONE DEFINITION (v50/v52).
     ⚠️ This block said "THE APP KEEPS NO BRACKET WIN-LOSS RECORD AT ALL"
     until v58 — true when v19 wrote it, false from v50, and the same stale
     claim was ALSO rendering on the Honors tab where a reader could see it
     contradict the Records tab one swipe away. A comment that outlives its
     fact is how the next session reintroduces the bug it describes.
     A manager's playoff résumé is FINAL FOURS (`f4`) *and* the championship-
     bracket record (`bw`/`bl`/`bA`) — two different populations, each stating
     its own, never added together.

     Three brackets run every December and the data files them as `br`:
       W   the championship bracket — six teams: round 1, the final four, the
           final. Its R2 IS the final four.
       WC  the placement ladder below it, for teams knocked out of W (3rd, 5th)
       C   the consolation ladder for the six that missed, GmC1-9 (GmC3 = the
           Cum Bowl)
     🚨 ONLY `W` PRODUCES A W-L. The placement and consolation ladders never
     do, and that is the v14 lesson holding: it found the app printing three
     different "playoff records" for one person (11-4 for W+WC, 10-3 for W, 22
     meetings for everything), each computed correctly, and the page still lied
     because nothing said which population each counted.
     ⚠️ What v19 could not fix by captioning — a record covering 7 of 13
     seasons sitting beside stats covering all 13 — **the DATA fixed in
     v56/v57**: every season has a bracket now, so the record's span and the
     appearance rate's span are the same 13. That is why it could come back.
     ⚠️ Still deliberately NOT a final-four W-L: "8 final fours" over "5-3 in
     the final four" is two denominators side by side inviting the reader to
     add them up, which is the v3 fault wearing a new name.
     The games themselves are still used — head-to-heads, playoff scores, the
     regular-season-to-playoff scoring gap — as MEETINGS and SCORES, never
     totalled into a record. */
  const CB_APP = {};
  CUMBOWL.forEach((c) => [c.s11, c.s12].forEach((t) => { CB_APP[key(c.yr, t)] = 1; }));

  /* ---- per-manager careers ------------------------------------------------ */
  const MGRS = {};
  SEASON.forEach((s) => s.rows.forEach((r) => {
    if (!r.mgr) return;
    const a = MGRS[r.mgr] || (MGRS[r.mgr] = { m: r.mgr, logo: MGR_LOGO[r.mgr],
      seasons: 0, w: 0, l: 0, pf: 0, pa: 0, t1: 0, t2: 0, t3: 0, po: 0, fin: 0, f4: 0, bw: 0, bl: 0, bA: 0, cb: 0, cbA: 0,
      yrs: [], allW: 0, allL: 0, pfRankSum: 0, placeSum: 0 });
    a.seasons++; a.w += r.w; a.l += r.l; a.pf += r.pf; a.pa += r.pa;
    a.yrs.push(r);
    /* All-play: rank the 12 teams by points, then play everyone. Season-level,
       NOT weekly — the data has no weekly scores and the label must say so. */
    a.allW += s.rows.length - r.pfRank; a.allL += r.pfRank - 1;
    a.pfRankSum += r.pfRank;
    if (s.fin) {
      a.placeSum += r.place;
      if (r.place === 1) a.t1++; if (r.place === 2) a.t2++; if (r.place === 3) a.t3++;
      if (r.place <= PO_CUT) a.po++; if (r.place <= 2) a.fin++;
      /* 🚨 The final four IS places 1-4, and that is a structural fact, not a
         guess: the two teams that lose the semi-final play each other for 3rd,
         so the four survivors of round 1 are exactly the top four finishers.
         Verified against the R2 pairings of all 13 brackets on file — which is
         what makes final fours knowable for all 13 seasons, the same shape as
         "a top-6 seed always finishes top 6". */
      if (r.place <= 4) a.f4++;
    } else if (s.champ && s.champ.t === r.t) a.t1++;
    if (CB_LOSER[s.yr] === r.t) a.cb++;
    a.cbA += CB_APP[key(s.yr, r.t)] || 0;
  }));
  /* 🚨 `name` is a LIVE getter, not a value. It was a plain field copied from
     nm() at build time — which is before anyone has picked a name — so every
     view that reads `a.name` (the trophy case, the luck index, the playoff
     table, the Cum Bowl record, a profile header) went on printing the
     manager's own name after `setMe` had made them the reader. Only the few
     places that happened to call nm() live said "You", so the app was
     second-person in patches. **A value derived at init cannot answer a
     question asked later.** */
  Object.values(MGRS).forEach((a) => {
    Object.defineProperty(a, 'name', { get: () => nm(a.m), enumerable: true });
  });
  Object.values(MGRS).forEach((a) => {
    a.pct = a.w / (a.w + a.l);
    a.allPct = a.allW / (a.allW + a.allL);
    a.luck = (a.pct - a.allPct) * 100;          // + = won more than the scoring deserved
    a.ppg = a.pf / (a.w + a.l);
    a.papg = a.pa / (a.w + a.l);
    a.avgPlace = a.placeSum / a.yrs.filter((r) => r.place).length;
    a.avgPfRank = a.pfRankSum / a.seasons;
    a.poRate = a.po / a.yrs.filter((r) => r.place).length;
    a.best = a.yrs.filter((r) => r.place).sort((x, y) => x.place - y.place)[0];
    a.worst = a.yrs.filter((r) => r.place).sort((x, y) => y.place - x.place)[0];
  });
  const ALL = Object.values(MGRS);
  const byMedals = [...ALL].sort((a, b) => b.t1 - a.t1 || b.t2 - a.t2 || b.t3 - a.t3 || a.cb - b.cb || b.pct - a.pct);
  const LEAGUE_PPG = SEASON.reduce((a, s) => a + s.lgPpg, 0) / SEASON.length;

  /* ── EVERY RECORDED MEETING ────────────────────────────────────────────────
     PLAYOFF_GAMES covers ALL 13 SEASONS, 2013-2025. ⚠️ It covered only
     2018-24 until v56: the gap was never missing data, it was five seasons
     whose ESPN "Final Playoff Results" tab had not been captured, and the
     owner opened all five; v57 then added 2025 from the Sleeper bracket.
     ⚠️ **2025 is the championship bracket ONLY** — Sleeper published no
     placement or consolation games — so it contributes 5 games where a full
     season contributes 17, and any placement or consolation stat covers 12 of
     the 13. The 2025 Cum Bowl is reconstructed from the two worst seeds'
     real week-15 scores and is a real head-to-head that lives in another
     field — fold it in so the h2h pool is everything the archive knows.
     🚨 Still PLAYOFF meetings only: there is no regular-season schedule
     anywhere in this data, and every view must say so. */
  const seen = new Set(PLAYOFF_GAMES.map((g) => g.yr + '|' + [g.a, g.b].sort().join('|')));
  /* ⚠️ `plc` (the placement ladder) used to be folded in with `brk`, so a
     5th-place game and a semi-final printed the same word on a head-to-head
     row. Every meeting still counts as a meeting; the label says which. */
  const MEET = PLAYOFF_GAMES.map((g) => ({ ...g, kind: g.br === 'C' ? (g.rd === 'GmC3' ? 'cb' : 'con') : g.br === 'WC' ? 'plc' : g.rd === 'FINAL' ? 'fin' : g.rd === 'R2' ? 'f4' : 'r1' }));
  CUMBOWL.forEach((c) => { const k = c.yr + '|' + [c.s11, c.s12].sort().join('|');
    if (!seen.has(k)) { seen.add(k); MEET.push({ yr: c.yr, br: 'C', rd: 'GmC3', kind: 'cb', a: c.s12, as: c.p12, b: c.s11, bs: c.p11 }); } });
  LH.forEach((s2) => { if (!s2.final) return; const k = s2.yr + '|' + [s2.final.w, s2.final.l].sort().join('|');
    if (!seen.has(k)) { seen.add(k); MEET.push({ yr: s2.yr, br: 'W', rd: 'FINAL', kind: 'fin', a: s2.final.w, as: s2.final.ws, b: s2.final.l, bs: s2.final.ls }); } });
  MEET.sort((a, b) => b.yr - a.yr);

  /* Pairwise records. Keyed by the two manager codes, sorted, so a pair is one
     entry however the game listed them. */
  const H2H = {};
  MEET.forEach((g) => {
    const am = mgrOf(g.a), bm = mgrOf(g.b); if (!am || !bm || am === bm) return;
    const [x, y] = [am, bm].sort(); const k = x + '|' + y;
    const e = H2H[k] || (H2H[k] = { a: x, b: y, aw: 0, bw: 0, n: 0, ap: 0, bp: 0, games: [] });
    const aIsX = am === x, xs = aIsX ? g.as : g.bs, ys = aIsX ? g.bs : g.as;
    e.n++; e.ap += xs; e.bp += ys; if (xs > ys) e.aw++; else e.bw++;
    e.games.push({ yr: g.yr, kind: g.kind, rd: g.rd, xs, ys, xt: aIsX ? g.a : g.b, yt: aIsX ? g.b : g.a });
  });
  const PAIRS = Object.values(H2H).sort((p, q) => q.n - p.n || Math.abs(q.aw - q.bw) - Math.abs(p.aw - p.bw));

  /* ══ 🏆 THE CHAMPIONSHIP-BRACKET RECORD (v49, owner's call: "add record
     into playoff appearances") ═════════════════════════════════════════════
     🚨 THIS IS THE NUMBER v19 DELETED, AND IT IS BACK UNDER THE ONE CONDITION
     THAT MADE DELETING IT NECESSARY: exactly one definition, printed with its
     own denominator every time. v14 found the app showing three different
     "playoff records" for one person — 11-4 (W+WC), 10-3 (W) and 22 meetings
     — each computed correctly, and the page still lied because nothing said
     which population each counted. v19 removed it rather than caption it.
     So: `W` ONLY. The six-team championship bracket — R1, the final four,
     the final. NOT the WC placement ladder (games between teams already out
     of the title race), NOT the C consolation ladder, NOT the Cum Bowl. That
     is the population v14 settled on and it has not changed.
     ⚠️ 65 games across ALL 13 seasons (v57 closed the last gap). 🚨 **The
     v3 adjacency risk this was written against is GONE, and that is worth
     stating rather than leaving the old warning up**: with a bracket on file
     for every season, a manager's bracket count IS their playoff appearance
     count — verified, `bA === po` for all twelve — so the record and the rate
     beside it now share a denominator instead of merely looking as though
     they do. The owner's own arithmetic closes on every row: losses ==
     appearances − titles. Every place it prints still carries the ⚑ badge and
     still names its own bracket count, because the population (championship
     bracket only) is still narrower than the meetings pool.
     ⚠️ Deliberately NOT reconstructed from `s2.final` the way MEET is: that
     would add a final from seasons with no bracket, so the record would cover
     more seasons in its last round than in its first. One population.
     ⚠️ No ties to resolve — verified, zero tied games in all 65. */
  const BR_YRS = [...new Set(PLAYOFF_GAMES.filter((g) => g.br === 'W').map((g) => g.yr))].sort();
  const BR_SET = new Set(BR_YRS);
  const brSeen = {};
  PLAYOFF_GAMES.forEach((g) => {
    if (g.br !== 'W') return;
    const aWon = g.as > g.bs;
    [[mgrOf(g.a), aWon], [mgrOf(g.b), !aWon]].forEach(([m, won]) => {
      const a = m && MGRS[m]; if (!a) return;
      if (won) a.bw++; else a.bl++;
      /* 🚨 `bA` IS THE DENOMINATOR THE RECORD CANNOT BE READ WITHOUT, and it
         exists because the owner read the row and did the right arithmetic:
         *"Shouldn't I have 6 losses since 10 appearances and 4 titles"*. He
         is correct — a championship bracket is single elimination, so across
         a whole career losses ARE appearances minus titles. It came out 3
         because the record covers the 5 brackets he is IN ON FILE, not his
         10 appearances. **The number was right and the row was silent about
         which seasons it counted, which is the v3 fault exactly** — and it
         took the owner ten seconds to hit it. So the row prints this too. */
      const k = m + '|' + g.yr;
      if (!brSeen[k]) { brSeen[k] = 1; a.bA++; }
    });
  });


  /* ══════════════════════════════════════════════════════════════════════════
     🚨 WHERE EACH NUMBER COMES FROM — say it on the number, not in a footnote.
     This archive holds THREE different kinds of fact and they are easy to
     confuse, which would make the whole tab untrustworthy:
       • reg  — the regular season (every W-L and every points total: the ESPN
                final standings are regular-season standings)
       • po   — PLAYOFF GAMES ONLY, and only the 7 seasons with a bracket on
                file plus the Cum Bowls. There is NO regular-season schedule
                anywhere in this data, so nothing here is a career head-to-head.
       • fin  — the final playoff PLACEMENT (1st-12th), which is what the rank
                in every table means.
     A stat that mixes them says so. Anything tagged `po` is a small sample by
     construction — that is stated too, not hidden. */
  const SRC = {
    reg: ['reg', 'Regular season'],
    po: ['po', 'Playoffs only'],
    fin: ['fin', 'Final placing'],
    mix: ['mix', 'Mixed'],
  };
  const tag = (k) => { const [c, l] = SRC[k]; return `<span class="fh-src ${c}">${l}</span>`; };
  /* Inline, for a row inside a table where a heading badge is too far away. */
  const dot = (k) => { const [c, l] = SRC[k]; return `<em class="fh-dot ${c}" title="${l}">${l}</em>`; };
  const PO_YRS = new Set(PLAYOFF_GAMES.map((g) => g.yr)).size;
  const PO_NOTE = `⚠️ <b>Playoff games only.</b> The archive has final standings and playoff brackets — <b>no regular-season schedule</b> — so this covers the ${PLAYOFF_GAMES.length} bracket games across ${PO_YRS} seasons, plus the ${CUMBOWL.length} Cum Bowls. It is not a career record.`;

  /* What the three badges mean. It was a card at the top of Honors; from v13
     it lives in the ? sheet in the header, where it is reachable from EVERY
     page instead of only the one the reader happened to open on — a badge on
     the Cum Bowl table was four taps from its own key.

     🚨 The counts stay HERE, derived, in the module that holds the data. The
     sheet is assembled in `league.js`, and a hand-typed "119 bracket games"
     over there would be wrong the first time a season lands — the same rule
     the storylines follow. `league.js` asks for this; it never restates it. */
  function keyHTML() {
    return `<div class="fh-key-r">${tag('fin')}<span>The <b>rank</b> in every table is where you finished after the playoffs.</span></div>
      <div class="fh-key-r">${tag('reg')}<span>Every <b>W-L and points total</b> is the regular season — that is what ESPN's standings hold.</span></div>
      <div class="fh-key-r">${tag('po')}<span>Anything with this badge counts <b>playoff games only</b>: ${PLAYOFF_GAMES.length} bracket games from ${PO_YRS} of ${SEASON.length} seasons, plus ${CUMBOWL.length} Cum Bowls. Small samples, and no regular-season schedule exists to widen them.</span></div>`;
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const one = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const ord = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
  const rec = (r) => `${r.w}-${r.l}`;
  const pct1 = (x) => `${(x * 100).toFixed(1)}%`;
  /* A gap that rounds to 0.0 is neither good nor bad, so it must not be
     painted as a miss — the v189 semantic-colour rule. */
  const lkCls = (n) => (Math.abs(n) < 0.05 ? 'hold' : n < 0 ? 'neg' : 'pos');
  /* A real minus sign, not a hyphen. These are numbers in prose — "a −15.2
     collapse" is typeset, "a -15.2 collapse" is typed. Nothing parses this
     back, it is display only. */
  const sgn = (n, d = 1) => { const r = +n.toFixed(d); return r > 0 ? '+' + r.toFixed(d) : r.toFixed(d).replace('-', '\u2212'); };

  /* Person first, franchise underneath — the whole point of the name map. */
  const crest = (m, size) => (MGR_LOGO[m]
    ? `<img class="fh-crest" style="width:${size}px;height:${size}px" src="logos/${MGR_LOGO[m]}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'fh-crest fh-crest-x',textContent:'?'}))">`
    : `<span class="fh-crest fh-crest-x" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .44)}px">?</span>`);
  const who = (r, extra) => {
    const m = r.mgr || mgrOf(r.t);
    return `<span class="fh-who${isMe(m) ? ' you' : ''}"><b>${esc(m ? nm(m) : r.t)}</b>` +
      `<i>${m ? esc(r.t) : (untracked(r.t) ? `${esc(mgrRaw(r.t))} · not tracked` : 'unclaimed')}${extra ? ` · ${extra}` : ''}</i></span>`;
  };
  /* Every name is a door to that manager's profile. */
  const tap = (m, inner) => (m ? `<button type="button" class="fh-tap" data-mgr="${m}">${inner}</button>` : inner);

  /* ══ 🏆 HONORS ═══════════════════════════════════════════════════════ */
  function heroHTML() {
    const names = new Set(); SEASON.forEach((s) => s.rows.forEach((r) => names.add(r.t)));
    const champMgrs = new Set(SEASON.map((s) => s.champ && s.champ.mgr).filter(Boolean));
    const topSeedWon = SEASON.filter((s) => s.fin && s.top.place === 1).length;
    const finSeasons = SEASON.filter((s) => s.fin).length;
    const worstWin = SEASON.filter((s) => s.champ).map((s) => s.champ).sort((a, b) => a.pct - b.pct)[0];
    const ringless = ALL.filter((a) => !a.t1).length;
    return `<div class="fh-hero">
      <div class="fh-hero-k">Nectars Bolonga</div>
      <h3>13 seasons of receipts</h3>
      <p>Every final standing from <b>2013</b> to <b>2025</b>. The rank is the <b>playoff</b> finish; the record beside it is the <b>regular season</b> — and they disagree constantly.</p>
    </div>
    <div class="ffp-strip">
      <div class="ffp-tile"><div class="v">${SEASON.length}</div><div class="k">Seasons</div></div>
      <div class="ffp-tile"><div class="v">${champMgrs.size}</div><div class="k">Champions</div></div>
      <div class="ffp-tile"><div class="v neg">${ringless}</div><div class="k">Never won</div></div>
      <div class="ffp-tile"><div class="v wm">${topSeedWon}<span class="of">/${finSeasons}</span></div><div class="k">Top seed won</div></div>
      <div class="ffp-tile"><div class="v">${names.size}</div><div class="k">Team names</div></div>
      <div class="ffp-tile"><div class="v neg">${rec(worstWin)}</div><div class="k">Worst to win</div></div>
    </div>`;
  }

  /* 🚨 A podium place held by an UNTRACKED manager falls back to the person,
     not the franchise. The owner asked for two managers to be out of the
     stats, and printing their team name here would put them straight back in
     — while deleting the row would make a silver medal vanish, which is the
     older and worse fault (a list that is silently shorter than the truth). */
  /* 🚨 AN UNTRACKED MANAGER IS STILL A PERSON ON A PODIUM (v19, owner's call
     on the 2013 and 2014 silvers: *"just write Ebzery here"*). "not tracked"
     was the right answer to the wrong question: the rule is that these two
     carry no CAREER — no row in a table, no rate, no tally, no profile — and
     nothing about that requires a medal line to refuse to say who won it.
     `mgrRaw` knows them; only `mgrOf` deliberately does not. */
  const podium = (r) => esc(nm(r.mgr) || mgrRaw(r.t) || r.t);

  /* 🚨 THE NEWEST CHAMPION IS A ROW LIKE THE OTHERS (v20, owner's call:
     *"This 2025 champion card should be same as others"*). It used to be a
     crown — a 64px crest, a 24px name, a gold rule and the final score —
     above twelve uniform rows. Two problems with that, and the owner saw the
     second: it made the current champion a different KIND of thing from the
     twelve before him, and it printed the only two-decimal numbers in the app
     (124.04–107.28, straight off Sleeper) next to a page that rounds
     everything to one.
     ⚠️ The final score goes with it. Only 5 of 13 seasons have one on file,
     so putting it on the rows that have it would rebuild the same problem one
     row down: some champions with a detail and some without. The 2025 final
     is still in the archive — it is folded into MEET, so it shows up in the
     head-to-head between the two people who played it. */
  function champsHTML() {
    return `<h2 class="section-title">🏆 Champions</h2>
    <div class="ffp-card fh-pad0">${SEASON.map((s) => {
      const c = s.champ, you = isMe(c.mgr);
      return `<div class="fh-yr${you ? ' you' : ''}">
        <div class="fh-yr-n">${s.yr}${s.platform === 'sleeper' ? '<i class="fh-plat">SLEEPER</i>' : ''}</div>
        <div class="fh-yr-b">
          <div class="fh-champ">${crest(c.mgr, 38)}${tap(c.mgr, who(c, rec(c)))}</div>
          <div class="fh-updown">${s.fin
            ? `<span>🥈 ${podium(s.rows[1])}</span><span>🥉 ${podium(s.rows[2])}</span>`
            : '<span class="fh-unk">runner-up not known — that table is sorted by win%</span>'}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function trophyHTML() {
    const mx = Math.max(...byMedals.map((a) => a.t1 + a.t2 + a.t3));
    return `<h2 class="section-title">👑 The trophy case ${tag('fin')}</h2>
    <div class="ffp-card">
      <div class="fh-med-h"><span></span><span>🥇</span><span>🥈</span><span>🥉</span><span class="cbh">CB</span><span>🚽</span></div>
      ${byMedals.map((a) => `<div class="fh-med${isMe(a.m) ? ' you' : ''}">
        ${tap(a.m, `<div class="fh-med-n">${crest(a.m, 36)}
          <div><b>${esc(a.name)}</b><i>${a.seasons} seasons · ${a.w}-${a.l} reg. season</i>
            <div class="fh-pips">${'<i class="g"></i>'.repeat(a.t1)}${'<i class="s"></i>'.repeat(a.t2)}${'<i class="b"></i>'.repeat(a.t3)}${a.t1 + a.t2 + a.t3 === 0 ? '<i class="n"></i>' : ''}</div>
          </div></div>`)}
        <div class="fh-med-v${a.t1 ? ' g' : ' zero'}">${a.t1 || '–'}</div>
        <div class="fh-med-v${a.t2 ? ' s' : ' zero'}">${a.t2 || '–'}</div>
        <div class="fh-med-v${a.t3 ? ' b' : ' zero'}">${a.t3 || '–'}</div>
        <div class="fh-med-v${a.cbA ? ' app' : ' zero'}">${a.cbA || '–'}</div>
        <div class="fh-med-v${a.cb ? ' cb' : ' zero'}">${a.cb || '–'}</div>
      </div>`).join('')}
      <div class="fh-med-leg">Medals are the <b>playoff</b> finish; the W-L under each name is the <b>regular season</b>. <b>CB</b> = Cum Bowls played · <b>🚽</b> = Cum Bowls lost. Playing one means you were a bottom-two seed; losing one makes you the league's worst. Tap a name for that manager's full career.</div>
    </div>`;
  }

  function ringlessHTML() {
    const r = ALL.filter((a) => !a.t1).sort((a, b) => b.fin - a.fin || (b.t2 + b.t3) - (a.t2 + a.t3) || b.pct - a.pct);
    return `<h2 class="section-title">💔 Still waiting</h2>
    <div class="ffp-card">
      <p class="fh-lead"><b>${r.length} of ${ALL.length} managers have never won it.</b> Between them they have <b>${r.reduce((a, x) => a + x.fin, 0)} finals</b> and <b>${r.reduce((a, x) => a + x.t2 + x.t3, 0)} podiums</b>.</p>
      ${r.map((a) => `<div class="fh-rl">${tap(a.m, `<div class="fh-rl-n">${crest(a.m, 32)}<b>${esc(a.name)}</b></div>`)}
        <span class="fh-rl-s">${a.seasons} seasons · ${a.fin ? `${a.fin} final${a.fin > 1 ? 's' : ''}` : 'no finals'} · best ${ord(a.best.place)}</span>
      </div>`).join('')}
    </div>`;
  }

  const allRows = [].concat(...SEASON.map((s) => s.rows));
  const fin = SEASON.filter((s) => s.fin);

  /* ══ 🎲 THE LUCK INDEX ════════════════════════════════════════════════ */
  /* 🚨 THE DENOMINATOR NOTE LIVES IN THE CAPTION, NOT THE LEAD (v26, owner:
     *"Make the luck index blurb simpler. Just explain what the percentage
     means"*). The lead is two sentences now and answers exactly that question.
     ⚠️ But the note itself is MOVED, never deleted, and that is deliberate:
     the rows print "97-46 deserved · 93-81 actual" side by side, and v3 exists
     because the owner read exactly that and asked *"shouldn't it be the
     same?"*. Simplifying the lead is the ask; deleting the sentence that
     answers the obvious question would re-open the bug v3 was filed for. */
  function luckHTML() {
    const rows = [...ALL].sort((a, b) => a.luck - b.luck);
    const mx = Math.max(...rows.map((a) => Math.abs(a.luck)));
    return `<h2 class="section-title">🎲 The luck index ${tag('reg')}</h2>
    <div class="ffp-card">
      <p class="fh-lead">Rank all twelve teams by <b>points</b> each season and play everyone: that is the record your scoring deserved.<br><br>
      <b>The number on the right is the gap, in win rate.</b> ${(() => { const a = rows[0]; return `${esc(a.name)} scored like a ${pct1(a.allPct)} team and actually went ${pct1(a.pct)} — that is ${sgn(a.luck)}.`; })()} <b>The bigger the minus, the worse the luck</b> — a plus means the schedule was kind.</p>
      ${rows.map((a) => `<div class="fh-lx${isMe(a.m) ? ' you' : ''}">
        ${tap(a.m, `<div class="fh-lx-n"><b>${esc(a.name)}</b><i>${a.allW}-${a.allL} deserved · ${a.w}-${a.l} actual</i></div>`)}
        <div class="fh-lx-bar"><span class="${lkCls(a.luck)}" style="width:${(Math.abs(a.luck) / mx) * 50}%;${a.luck < 0 ? 'right' : 'left'}:50%"></span><em></em></div>
        <div class="fh-lx-v ${lkCls(a.luck)}">${sgn(a.luck)}</div>
      </div>`).join('')}
      <p class="ffp-cap"><b>${esc(rows[0].name)}</b> ${vb(rows[0].m, 'have', 'has')} outscored the field by more than anyone and won ${one(Math.abs(rows[0].luck))} points of win% less than that deserved. <b>${esc(rows[rows.length - 1].name)}</b> ${vb(rows[rows.length - 1].m, 'are', 'is')} the opposite — and ${vb(rows[rows.length - 1].m, 'have', 'has')} ${rows[rows.length - 1].t1} title${rows[rows.length - 1].t1 === 1 ? '' : 's'}.<br><br>⚠️ The two records cover different numbers of games — all-play is <b>11 opponents a season</b>, a real schedule is 13 or 14 — so the win totals were never going to match. The gap is between the <b>rates</b>, not the totals.<br><br>⚠️ This is <b>season-total</b> all-play: the archive has season points, not week-by-week scores, so it cannot be the true weekly version. It is the right shape, not the exact number.</p>
    </div>`;
  }

  /* ══ 🔥 WHO SHOWS UP IN JANUARY ═══════════════════════════════════════
     🚨 READS `ST.era`, THE SAME OBJECT THE STORYLINE DETECTORS READ, AND
     THAT IS THE WHOLE OF WHY THIS IS SAFE TO ADD. `januaryGap()` has
     computed this gap for every manager since v2 and only ever printed the
     single biggest faller and the single biggest riser, gated at −5 and +4.
     Computing it a second time here — even "correctly" — would be the v14
     fault exactly: one concept, two numbers, each right, and the page lying
     because nothing says which is which. One source, two presentations.
     ⚠️ WHY IT EARNS A CARD NOW: the gate was written when brackets existed
     for 7 seasons. Over 13 the spread widened and **ten of the twelve now
     sit more than two points from where they score in the regular season**,
     while the card still named two of them. That is the v7 coverage fault in
     a different costume — and, as in v7, it lands hardest on the managers the
     extreme-hunting detectors have least to say about.
     ⚠️ NO DENOMINATOR TRAP HERE, WHICH IS RARE FOR THIS APP: both numbers are
     the SAME manager over the SAME seasons, so scoring inflation moves both
     together and no era adjustment is needed. The cross-manager ranking is
     the only comparison that spans eras, so each row names its own sample. */
  function januaryHTML() {
    const rows = ALL.map((a) => ({ a, e: ST.era[a.m] })).filter((x) => x.e && x.e.n)
      .sort((x, y) => y.e.d - x.e.d);
    if (rows.length < 2) return '';
    const mx = Math.max(...rows.map((x) => Math.abs(x.e.d)));
    const up = rows.filter((x) => x.e.d > 0), top = rows[0], low = rows[rows.length - 1];
    return `<h2 class="section-title">🔥 Who shows up in January ${tag('po')}</h2>
    <div class="ffp-card">
      <p class="fh-lead">One manager, one set of seasons, two different months: regular-season scoring against the same manager's scoring once the bracket started.<br><br>
      <b>The number on the right is the difference, in points a game.</b> A plus means they raise it when it counts; a minus means the scoring came before the games that mattered.</p>
      ${rows.map(({ a, e }) => `<div class="fh-lx${isMe(a.m) ? ' you' : ''}">
        ${tap(a.m, `<div class="fh-lx-n"><b>${esc(a.name)}</b><i>${one(e.reg)} → ${one(e.po)} ppg · ${e.n} games</i></div>`)}
        <div class="fh-lx-bar"><span class="${lkCls(e.d)}" style="width:${(Math.abs(e.d) / mx) * 50}%;${e.d < 0 ? 'right' : 'left'}:50%"></span><em></em></div>
        <div class="fh-lx-v ${lkCls(e.d)}">${sgn(e.d)}</div>
      </div>`).join('')}
      <p class="ffp-cap"><b>${esc(top.a.name)}</b> ${vb(top.a.m, 'gain', 'gains')} the most — ${sgn(top.e.d)} a game — and <b>${esc(low.a.name)}</b> ${vb(low.a.m, 'lose', 'loses')} the most, ${sgn(low.e.d)}. ${cap(plWord(up.length, 'manager'))} of the ${rows.length} score more in the playoffs than out of them.<br><br>⚠️ <b>Both numbers on a row are that manager's own, over the seasons they actually reached the bracket</b> — so scoring inflation across the years moves the pair together and cancels out. That is what makes the gap fair; it is also why the rows count different numbers of games, and each says how many.<br><br>⚠️ The playoff half counts <b>every bracket game</b> — championship, placement and consolation alike — because it is a question about scoring, not about stakes. It is not a record and it is not a win rate.</p>
    </div>`;
  }

  /* ══ 📕 THE RECORD BOOK ═══════════════════════════════════════════════ */
  function recordHTML() {
    const pick = (arr, f, d) => [...arr].sort((a, b) => d * (f(a) - f(b)))[0];
    const gm = PLAYOFF_GAMES.map((g) => ({ ...g, marg: Math.abs(g.as - g.bs), hi: Math.max(g.as, g.bs), lo: Math.min(g.as, g.bs) }));
    const best = pick(allRows, (r) => r.pct, -1), worst = pick(allRows, (r) => r.pct, 1);
    const hiPpg = pick(allRows, (r) => r.ppg, -1), loPpg = pick(allRows, (r) => r.ppg, 1);
    const hiPa = pick(allRows, (r) => r.papg, -1);
    const close = pick(gm, (g) => g.marg, 1), blow = pick(gm, (g) => g.marg, -1);
    const hiG = pick(gm, (g) => g.hi, -1), loG = pick(gm, (g) => g.lo, 1);
    const gName = (t) => nm(mgrOf(t)) || t;
    /* 🚨 This card is the one place the two sources sit side by side — a
       regular-season scoring record directly above a single playoff game — so
       the badge goes on the ROW. A card-level caption would be read as covering
       everything above it, which is exactly the v203 "label smaller than the
       thing it labels" fault. */
    const row = (k, v, sub, src) => `<div class="fh-rb"><div class="fh-rb-v">${v}</div><div class="fh-rb-t"><b>${k}${dot(src)}</b><i>${sub}</i></div></div>`;
    return `<h2 class="section-title">📕 The record book</h2>
    <div class="ffp-card">
      ${row('Best season', rec(best), `${esc(nm(best.mgr))} · ${best.yr} · finished ${ord(best.place)}`, 'reg')}
      ${row('Worst season', rec(worst), `${esc(nm(worst.mgr))} · ${worst.yr} · finished ${ord(worst.place)}`, 'reg')}
      ${row('Highest scoring', one(hiPpg.ppg), `${esc(nm(hiPpg.mgr))} · ${hiPpg.yr} · per game · finished ${ord(hiPpg.place)}`, 'reg')}
      ${row('Lowest scoring', one(loPpg.ppg), `${esc(nm(loPpg.mgr))} · ${loPpg.yr} · per game`, 'reg')}
      ${row('Most points against', one(hiPa.papg), `${esc(nm(hiPa.mgr))} · ${hiPa.yr} · per game · ${rec(hiPa)}`, 'reg')}
      ${row('Closest game', one(close.marg), `${close.yr} · ${esc(gName(close.a))} ${close.as} – ${close.bs} ${esc(gName(close.b))}`, 'po')}
      ${row('Biggest blowout', one(blow.marg), `${blow.yr} · ${esc(gName(blow.as > blow.bs ? blow.a : blow.b))} ${Math.max(blow.as, blow.bs)} – ${Math.min(blow.as, blow.bs)}`, 'po')}
      ${row('Best game score', one(hiG.hi), `${esc(gName(hiG.as > hiG.bs ? hiG.a : hiG.b))} · ${hiG.yr}`, 'po')}
      ${row('Worst game score', one(loG.lo), `${esc(gName(loG.as < loG.bs ? loG.a : loG.b))} · ${loG.yr}`, 'po')}
      <p class="ffp-cap">The four <b>playoff</b> rows come from a different pool to the five regular-season ones — ${PLAYOFF_GAMES.length} bracket games across all ${SEASON.length} seasons. ⚠️ 2025 is the championship bracket only — Sleeper published no placement or consolation games, so it contributes 5 games where a full season contributes 17. Scoring records are <b>per game</b> — seasons were 13 games until 2021 and 14 since, so raw totals would not compare.</p>
    </div>`;
  }

  /* ══ 👑 THE CHAMPION'S CURSE ══════════════════════════════════════════ */
  function curseHTML() {
    const asc = [...SEASON].sort((a, b) => a.yr - b.yr);
    const pairs = [];
    asc.forEach((s, i) => {
      const nxt = asc[i + 1]; if (!nxt || !s.champ || !nxt.fin) return;
      const after = nxt.rows.find((r) => r.mgr && r.mgr === s.champ.mgr);
      if (after) pairs.push({ yr: s.yr, m: s.champ.mgr, next: nxt.yr, place: after.place, rec: rec(after) });
    });
    const avg = pairs.reduce((a, p) => a + p.place, 0) / pairs.length;
    const made = pairs.filter((p) => p.place <= 6).length;
    /* ⚠️ 📉, NOT 👑 (v50). The curse moved onto Honors, where **👑 is already
       the trophy case** — two identical marks on one page, and two identical
       chips in the jump row, which is read by its mark. The clash did not
       exist while the two cards were on different tabs; it is a consequence of
       the move, so it is fixed in the same edit. 📉 also says what the card
       found: the year after you win it, you fall. */
    return `<h2 class="section-title">📉 The champion's curse ${tag('fin')}</h2>
    <div class="ffp-card">
      <div class="fh-big"><b>${one(avg)}</b><span>average finish the year after winning it</span></div>
      <p class="fh-lead">Only <b>${made} of ${pairs.length}</b> defending champions even made the playoffs again.</p>
      ${pairs.slice().reverse().map((p) => `<div class="fh-cz${isMe(p.m) ? ' you' : ''}">
        <span class="fh-cz-y">${p.yr}<i>🏆</i></span>
        ${tap(p.m, `<b>${esc(nm(p.m))}</b>`)}
        <span class="fh-cz-a ${p.place <= 6 ? 'pos' : 'neg'}">${p.next}: ${ord(p.place)} <i>${p.rec}</i></span>
      </div>`).join('')}
    </div>`;
  }

  /* ══ 🎯 SEEDS & UPSETS ════════════════════════════════════════════════ */
  function seedHTML() {
    const LOW_SEED = PO_CUT;
    const seeded = SEASON.filter((s) => s.rows.every((r) => r.seed));
    const wb = PLAYOFF_GAMES.filter((g) => g.br === 'W');
    const seedOf = (yr, t) => { const s = SEASON.find((x) => x.yr === yr); const r = s && s.rows.find((x) => x.t === t); return r && r.seed; };
    let better = 0, total = 0; const ups = [];
    wb.forEach((g) => {
      const sa = seedOf(g.yr, g.a), sb = seedOf(g.yr, g.b); if (!sa || !sb) return;
      total++;
      const [wS, lS, wT] = g.as > g.bs ? [sa, sb, g.a] : [sb, sa, g.b];
      if (wS < lS) better++; else ups.push({ yr: g.yr, rd: g.rd, w: wT, wS, lS, sc: `${Math.max(g.as, g.bs)}–${Math.min(g.as, g.bs)}`,
        l: g.as > g.bs ? g.b : g.a, gap: wS - lS });
    });
    const bySeed = {};
    seeded.forEach((s) => s.rows.forEach((r) => { if (r.place) (bySeed[r.seed] = bySeed[r.seed] || []).push(r.place); }));
    const champSeeds = seeded.map((s) => s.champ && s.champ.seed).filter(Boolean);
    const cnt = {}; champSeeds.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; });
    /* 🚨 DERIVED, never typed. This read "Two #6 seeds have won the whole
       thing — and both beat the #1 seed in the final" as hard-coded prose. It
       is true today (2018 and 2023) and was true only by luck: it would have
       gone on asserting "two" through any new seeded season. A sentence about
       a count that the data can produce is a sentence the data should produce.
       ⚠️ The count is SPELLED beside "#6" — "2 #6 seeds" is two numerals
       touching, the v17 fault. */
    /* 🚨 `SEASON` IS STORED NEWEST FIRST, so `seeded[0]` is the most RECENT
       season — printing `seeded[0].yr`-`seeded[last].yr` gave "2025-2018",
       a range running backwards. Sorted explicitly rather than trusting
       array order, which is the same rule `byPF`/`bySeed` follow above. */
    const sdYrs = seeded.map((s) => s.yr).sort((a, b) => a - b);
    const sixes = seeded.filter((s) => s.champ && s.champ.seed === LOW_SEED);
    const sixBeat1 = sixes.filter((s) => {
      const f = wb.find((g) => g.yr === s.yr && g.rd === 'FINAL'); if (!f) return false;
      return seedOf(s.yr, f.as > f.bs ? f.b : f.a) === 1;
    });
    const sixLine = !sixes.length ? '' :
      ` <b>${cap(plWord(sixes.length, `${'#'}${LOW_SEED} seed`))} ${sixes.length === 1 ? 'has' : 'have'} won the whole thing</b>` +
      (sixBeat1.length === sixes.length
        ? ` — and ${sixes.length === 1 ? 'beat' : sixes.length === 2 ? 'both beat' : 'every one beat'} the ${'#'}1 seed in the final.`
        : `, ${plWord(sixBeat1.length, 'of them')} over the ${'#'}1 seed.`);
    return `<h2 class="section-title">🎯 Seeds &amp; upsets ${tag('po')}</h2>
    <div class="ffp-card">
      <div class="fh-big"><b>${Math.round((better / total) * 100)}%</b><span>how often the better seed wins a playoff game</span></div>
      <div class="fh-seed">${[1, 2, 3, 4, 5, 6].map((sd) => `<div class="fh-seed-c${cnt[sd] ? ' won' : ''}">
        <b>${cnt[sd] || '–'}</b><i>#${sd}</i></div>`).join('')}</div>
      <div class="fh-seed-l">Titles won from each playoff seed · ${seeded.length} seasons with seeds on file</div>
      <div class="fh-sub">Biggest upsets</div>
      ${ups.sort((a, b) => b.gap - a.gap || (a.rd === 'FINAL' ? -1 : 1)).slice(0, 5).map((u) => `<div class="fh-up">
        <span class="fh-up-y">${u.yr}</span>
        <div class="fh-up-t"><b>#${u.wS} ${esc(nm(mgrOf(u.w)) || u.w)}</b> beat <b>#${u.lS} ${esc(nm(mgrOf(u.l)) || u.l)}</b><i>${u.rd === 'FINAL' ? '🏆 championship' : u.rd === 'R2' ? 'semi-final' : 'round 1'} · ${u.sc}</i></div>
      </div>`).join('')}
      <p class="ffp-cap">🚨 <b>This is the one card that does not cover every season.</b> ESPN published a seeding for ${seeded.length} of the ${SEASON.length} (${sdYrs[0]}-${sdYrs[sdYrs.length - 1]}), so this counts <b>${total}</b> championship-bracket games — not the ${PLAYOFF_GAMES.length} the ⚑ badge covers, and not the ${SEASON.length - seeded.length} earlier seasons. Their brackets are on file; their seed order is not, and the archive will not guess one.<br><br>The better seed wins just <b>${better} of those ${total}</b> — a better seed is barely better than a coin toss here.${sixLine}</p>
    </div>`;
  }

  /* ══ 📊 PLAYOFF APPEARANCES ═══════════════════════════════════════════
     ⚠️ RENAMED FROM "Playoff record" IN v48, because the card under it
     changed. It used to head two cards — this rate AND the final-four funnel
     — so "record" covered the whole résumé. Alone, it heads a card whose
     headline is how often you get in, so a heading promising a *record* would
     be the v14 fault: a name that makes a number sound like another number.
     It matches the career tile, which has read `Playoff apps` since v10.
     ⚠️ This said "**this app keeps no bracket win-loss record at all** (v19)"
     until v58 — false since v50 put `bw`/`bl` on this very card, one function
     below. The record is here; the *heading* still is not about it. */
  function playoffHTML() {
    const rows = [...ALL].sort((a, b) => b.poRate - a.poRate || b.po - a.po);
    /* 🚨 THE RECORD CARRIES THE ⚑ GLYPH, NOT `dot('po')` — and that was a
       render finding, not a style preference. `dot()` prints the badge's full
       uppercase label, because it is built to caveat ONE number somewhere a
       heading badge cannot reach. Down twelve consecutive rows, "PLAYOFFS
       ONLY" is louder than the records it is qualifying, and it is the same
       six words twelve times; it also pushed the reader's own row onto a
       second line, because `.fh-po.you` is inset 14px each side and so wraps
       before every other row does. **The one row that looked broken was the
       reader's own.** The flag alone is the shape the ? sheet already
       teaches, and the caption carries the sentence once.
       ⚠️ The stats are on a SECOND LINE, not extra columns (v49). The row was
       a 96px name against a bar and a percentage, and a fourth column for the
       record left the name under 80px with most of the league truncated —
       the v39 standings fault exactly, and its fix is the same: the crest and
       the numbers have floors, the name is the only thing left to squeeze, so
       the stats move to a full-width line underneath. */
    return `<h2 class="section-title">📊 Playoff appearances ${tag('mix')}</h2>
    <div class="ffp-card">
      ${rows.map((a) => `<div class="fh-po${isMe(a.m) ? ' you' : ''}">
        <div class="fh-po-top">
          ${tap(a.m, `<div class="fh-po-n"><b>${esc(a.name)}</b></div>`)}
          <div class="fh-po-tr"><span style="width:${(a.poRate * 100).toFixed(1)}%"></span></div>
          <div class="fh-po-v">${Math.round(a.poRate * 100)}<small>%</small></div>
        </div>
        <div class="fh-po-s"><b>${a.po} of ${a.seasons}</b> seasons${a.bA
          ? ` <span class="fh-po-br" title="Playoffs only — championship bracket"><b>${a.bw}-${a.bl}</b> from ${a.bA} bracket${a.bA === 1 ? '' : 's'}</span>`
          : ' <span class="fh-po-br none" title="Playoffs only — championship bracket">no brackets on file</span>'}</div>
      </div>`).join('')}
      <p class="ffp-cap">The bar <b>is</b> the rate — a top-6 seed always finishes top 6 in this format, verified on every bracket, so this covers all ${SEASON.length} seasons.<br><br>✅ <b>Every season has a bracket on file now, so the arithmetic closes on every row.</b> A bracket is single elimination, so <b>losses are appearances minus titles</b> — and with no season missing, the bracket count beside each record <b>is</b> that manager's playoff appearances. Check any row: it works.<br><br>The ⚑ record counts the <b>championship bracket only</b> — ${PLAYOFF_GAMES.filter((g) => g.br === 'W').length} games, ${BR_YRS[0]}-${BR_YRS[BR_YRS.length - 1]} — never the placement ladder, the consolation bracket or the Cum Bowl. That is why it will never square with the ${MEET.length} meetings on the head-to-head pages.</p>
    </div>
    </div>`;
  }

  /* ══ 🎖️ FINAL FOURS ═══════════════════════════════════════════════════
     🚨 ITS OWN SECTION, AT THE BOTTOM OF HONORS (v48, owner's call: *"Put
     final fours at the bottom of honors instead of records"*). It was the
     second card inside `playoffHTML`, under a `.fh-sub` subheading — so it
     was a sub-card of Playoff record and could not be moved without being
     promoted first. As a `.section-title` it is a jump chip like every other
     card, which is the whole reason the nav picks it up with no edit.
     ⚠️ The 🎖️ is not decoration: Honors is the page of 🏆 / 👑 / 💔 and a
     fourth card needs a mark of its own to be findable in the jump row.
     ⚠️ AND IT IS THE FUNNEL, NOT A W-L (v19) — final fours · finals · won,
     three numbers from one source, each a subset of the one before it. The
     caption says why there is no bracket record and must not be trimmed into
     implying one exists. */
  function finalFoursHTML() {
    return `<h2 class="section-title">🎖️ Final fours ${tag('fin')}</h2>
    <div class="ffp-card">
      ${[...ALL].sort((a, b) => b.f4 - a.f4 || b.fin - a.fin || b.t1 - a.t1).map((a) => `<div class="fh-fr${isMe(a.m) ? ' you' : ''}">
        ${tap(a.m, `<b>${esc(a.name)}</b>`)}
        <span class="fh-fr-f">${a.f4 ? `${a.f4} final four${a.f4 > 1 ? 's' : ''}` : '<i>no final fours</i>'}${a.fin ? ` · ${a.fin} final${a.fin > 1 ? 's' : ''}` : ''}</span>
        <span class="fh-fr-g">${a.t1 ? `<span class="mono">${a.t1}</span> won` : '<i>none won</i>'}</span>
      </div>`).join('')}
      <p class="ffp-cap"><b>The final four is places 1-4</b>: the two teams that lose in the final four play each other for 3rd, so the four left after round one <b>are</b> the top four finishers. Verified against every bracket on file — all ${SEASON.length} seasons.<br><br>Six teams make the playoffs, so getting to the last four is the cut that means something. This is a count of <b>finishes</b>, not a record: the championship-bracket <b>win-loss record</b> is a different population and lives on <b>Playoff appearances</b> under Records. Placement games and the consolation ladder decide nothing and are kept as meetings, never as a record.</p>
    </div>`;
  }


  /* ══ 📌 STORYLINES ═══════════════════════════════════════════════════════
     The things a reader would actually tell somebody at a bar: worst-to-first,
     the best win% with no ring, the man who scores more than anyone and
     collapses in January.

     🚨 THEY ARE DETECTED, NOT WRITTEN. Every one of these started life as a
     paragraph typed into a chat — and a typed paragraph is wrong the moment a
     season lands ("Buley has finished 11th seven times" becomes eight). So a
     detector looks for a SHAPE in the data and fills the numbers in itself:
     the sentence is fixed, the facts are re-derived on every load. Same rule
     the Sports-Hub model card follows — a hand-written description of
     something computed is wrong the first time somebody changes it.

     🚨 AND EACH ONE IS ABOUT A SHAPE, NOT A PERSON. `worstToFirst` fires for
     anybody who wins a title off a bottom-four finish; it happens to be Woods
     twice today. Nothing here names a manager in its code, which is what stops
     the feature quietly becoming a hand-written page again.

     ⚠️ Every sentence has to read in SECOND PERSON too, because every one of
     these can be about the person holding the phone. Use nm() and vb(); never
     write "has" or "his".

     A detector returns `{ id, m, w, head, body, src }` or nothing:
       w    — how remarkable, 0-100, used only to rank
       src  — 'reg' | 'po' | 'fin' | 'mix', the provenance badge (see SRC)  */

  const mgrAt = (yr, t) => { const s = SEASON.find((x) => x.yr === yr); const r = s && s.rows.find((x) => x.t === t); return r && r.mgr; };
  const pl = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  /* 🚨 TWO NUMERALS MUST NOT TOUCH (v17, owner's call): "finished 11th 7
     times" makes the reader parse "11th 7" before the sentence resolves, and
     at a glance it can read as one number. Spell the second one out —
     "11th seven times". Only the small counts, because "11th seventeen times"
     is worse than the problem; above twelve the digit stays and the sentence
     has to be built so the pair does not collide. */
  const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six',
    'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const plWord = (n, one, many) => `${WORD[n] || n} ${n === 1 ? one : (many || one + 's')}`;
  /* ⚠️ `plWord` is lowercase, so it cannot open a sentence unaided — v39 shipped
     "six of twelve teams make it" mid-paragraph, twice, and it reads as a typo
     rather than as a number. Anything spelled that starts a sentence goes
     through this. */
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  /* "a 11-1 record" is the kind of thing only a generator writes. */
  const an = (n) => (/^(8|11|18|8\d|11\d)/.test(String(n)) ? 'an' : 'a');

  /* one pass for the things several detectors need */
  const ST = (() => {
    /* ⚠️ There is no `wbRec` here any more. It counted the title bracket
       correctly while `a.bw`/`a.bl` counted title + placement, so the two
       disagreed and both were on screen — one number, one place to get it
       from (v14). The detectors read `MGRS[m].bw`/`bl`. */
    const places = {}, scoring = {}, poScore = {}, cbScore = [], poScores = [];
    ALL.forEach((a) => { places[a.m] = {}; a.yrs.forEach((r) => { if (r.place) places[a.m][r.place] = (places[a.m][r.place] || 0) + 1; }); });
    SEASON.forEach((s) => { const top = [...s.rows].sort((x, y) => y.ppg - x.ppg)[0]; if (top.mgr) scoring[top.mgr] = (scoring[top.mgr] || 0) + 1; });
    PLAYOFF_GAMES.forEach((g) => {
      [[g.a, g.as], [g.b, g.bs]].forEach(([t, v]) => {
        const m = mgrAt(g.yr, t); if (!m) return;
        (poScore[m] = poScore[m] || { n: 0, s: 0 }).n++; poScore[m].s += v;
        poScores.push({ yr: g.yr, m, v, br: g.br, rd: g.rd });
      });
    });
    CUMBOWL.forEach((c) => [[c.s11, c.p11], [c.s12, c.p12]].forEach(([t, v]) => {
      const m = mgrAt(c.yr, t); if (m) cbScore.push({ yr: c.yr, m, v }); }));
    /* Regular-season scoring in the SAME seasons the playoff sample covers —
       comparing a 13-year regular-season average against a 7-year playoff one
       would measure the eras, not the manager.
       🚨 PER MANAGER, NOT `PO_YEARS` (v59). `PO_YEARS` is the seasons with
       ANY bracket on file, which did the filtering while that was 7 of 13.
       Now it is all 13, so it filters nothing — and 2025 is winner's-bracket
       only, so the six managers who missed its playoffs had a 2025 regular
       season in `reg` with no 2025 game opposite it in `po`. Hurd's gap read
       −9.1 and is −10.1. "Same manager, same seasons" means THAT manager's
       seasons with a bracket game, which is what this counts; it is also the
       only reading under which the card's caption is true. */
    const brYrs = {};
    PLAYOFF_GAMES.forEach((g) => [g.a, g.b].forEach((t) => {
      const m = mgrAt(g.yr, t); if (m) (brYrs[m] = brYrs[m] || new Set()).add(g.yr); }));
    const era = {};
    ALL.forEach((a) => {
      const rs = a.yrs.filter((r) => brYrs[a.m] && brYrs[a.m].has(r.yr));
      if (!rs.length || !poScore[a.m]) return;
      const reg = rs.reduce((x, r) => x + r.pf, 0) / rs.reduce((x, r) => x + r.w + r.l, 0);
      era[a.m] = { reg, po: poScore[a.m].s / poScore[a.m].n, n: poScore[a.m].n, d: poScore[a.m].s / poScore[a.m].n - reg };
    });
    poScores.sort((x, y) => y.v - x.v); cbScore.sort((x, y) => y.v - x.v);
    return { places, scoring, era, poScores, cbScore };
  })();

  /* Scoring relative to the league IN THAT SEASON, averaged over a career.
     The only era-safe way to compare a 2013 team with a 2025 one. */
  const relPpg = (a) => {
    const ys = a.yrs.map((r) => { const s2 = SEASON.find((x) => x.yr === r.yr); return s2 ? r.ppg - s2.lgPpg : 0; });
    return ys.length ? ys.reduce((x, y) => x + y, 0) / ys.length : 0;
  };

  /* Rank within a set, and say honestly when it is a tie rather than a win. */
  const leaders = (arr, val) => { const mx = Math.max(...arr.map(val)); return arr.filter((x) => val(x) === mx); };
  const tiedWith = (list, m) => list.filter((x) => x.m !== m).map((x) => nm(x.m));
  const alsoTxt = (others) => (others.length ? ` — tied with ${others.join(' and ')}` : '');

  /* The floor `signature` tops every manager up to (v22). One card stops a
     page being blank; two is what makes it worth opening. */
  const WANT = 2;

  const DETECT = [
    /* ── worst to first ─────────────────────────────────────────────────── */
    function worstToFirst() {
      const asc = [...SEASON].sort((a, b) => a.yr - b.yr), by = {};
      asc.forEach((s, i) => {
        const n = asc[i + 1]; if (!n || !n.champ || !n.champ.mgr) return;
        const prev = s.rows.find((r) => r.mgr === n.champ.mgr);
        const cut = Math.ceil(s.rows.length * 0.7);      // bottom third-ish, not a magic 9
        if (prev && prev.place && prev.place >= cut) (by[n.champ.mgr] = by[n.champ.mgr] || []).push({ from: prev.place, a: s.yr, b: n.yr });
      });
      return Object.entries(by).map(([m, runs]) => ({
        id: 'w2f', t: 'title', m, w: 70 + runs.length * 12, src: 'fin',
        head: `${nm(m)} ${vb(m, 'do', 'does')} worst-to-first as a party trick.`,
        body: runs.map((r) => `${ord(r.from)} → champion (${r.a}→${String(r.b).slice(2)}).`).join(' ') +
          ` ${runs.length} of the ${pl(MGRS[m].t1, 'title')} came straight off a bottom-four finish.`,
      }));
    },

    /* ── the same finish, over and over ─────────────────────────────────── */
    function stuckAt() {
      /* 🚨 Only the actual maximum gets "nobody does it more often". The first
         cut returned every manager with a 4+ repeat, so Buley (11th x7) and
         the champion (1st x4) BOTH claimed the record on the same page. A
         superlative that fires more than once is just wrong. */
      const best = ALL.map((a) => {
        const e = Object.entries(ST.places[a.m] || {}).sort((x, y) => y[1] - x[1])[0];
        return e && e[1] >= 4 ? { a, place: +e[0], n: e[1] } : null;
      }).filter(Boolean);
      if (!best.length) return [];
      const top = leaders(best, (x) => x.n);
      return top.map(({ a, place, n }) => ({ id: 'stuck', t: 'place', m: a.m, w: 40 + n * 8, src: 'fin',
        head: `${nm(a.m)} ${vb(a.m, 'have', 'has')} finished ${ord(place)} ${plWord(n, 'time')}.`,
        body: `Out of ${a.seasons}. No one in the league repeats a finish more often${alsoTxt(tiedWith(top.map((x) => ({ m: x.a.m })), a.m))}.` }));
    },

    /* ── the Cum Bowl record ────────────────────────────────────────────── */
    function cumbowl() {
      const app = leaders(ALL.filter((a) => a.cbA), (a) => a.cbA);
      const lost = leaders(ALL.filter((a) => a.cb), (a) => a.cb);
      const out = [];
      app.forEach((a) => out.push({ id: 'cbking', t: 'cb', m: a.m, w: 60 + a.cbA * 5, src: 'po',
        head: `${nm(a.m)} ${vb(a.m, 'have', 'has')} played ${pl(a.cbA, 'Cum Bowl')}, more than anyone${alsoTxt(tiedWith(app, a.m))}.`,
        body: `${lost.some((x) => x.m === a.m) ? `${vb(a.m, 'You have', 'And ' + nm(a.m) + ' has')} lost ${a.cb} of them — also the record. ` : ''}${a.t1 ? `There is a championship in there too.` : `${vb(a.m, 'You have', 'That is')} no title to set against it.`}` }));
      return out;
    },

    /* ── a whole career with nothing on the podium ──────────────────────── */
    function noPodium() {
      return ALL.filter((a) => a.seasons >= 8 && !a.yrs.some((r) => r.place && r.place <= 3)).map((a) => {
        /* The absence is only half the story — what makes it one is a career
           that plainly had the scoring to do better. Pull in any single-game
           record this manager happens to hold rather than stating it twice on
           two separate cards. */
        const bits = [];
        const pi = ST.poScores.findIndex((x) => x.m === a.m);
        if (pi >= 0 && pi < 3) bits.push(`the ${ord(pi + 1)}-best playoff score ever (${one(ST.poScores[pi].v)})`);
        if (ST.cbScore[0] && ST.cbScore[0].m === a.m) bits.push(`the highest Cum Bowl score ever (${one(ST.cbScore[0].v)})`);
        return { id: 'nopod', t: 'place', m: a.m, w: 75, src: 'fin',
          head: `${nm(a.m)} ${vb(a.m, 'have', 'has')} never finished in the top three.`,
          body: `The only manager in the league with none, across ${pl(a.seasons, 'season')}.${bits.length ? ` ${vb(a.m, 'You also hold', nm(a.m) + ' also holds')} ${bits.join(' and ')}.` : ''}` };
      });
    },

    /* ── never last, never a play-in ────────────────────────────────────── */
    function cleanFloor() {
      const n = SEASON[0].rows.length;
      return ALL.filter((a) => a.seasons >= 8 && !a.cbA && !a.yrs.some((r) => r.place === n)).map((a) => ({
        id: 'floor', t: 'place', m: a.m, w: 62, src: 'mix',
        head: `${nm(a.m)} ${vb(a.m, 'have', 'has')} never finished last or played a Cum Bowl.`,
        body: `The only manager with both, across ${a.seasons} seasons — with ${pl(a.fin, 'final')} and ${a.t1 ? pl(a.t1, 'title') : 'no title'}.` }));
    },

    /* ── the January collapse, and its opposite ─────────────────────────── */
    function januaryGap() {
      const es = Object.entries(ST.era); if (es.length < 6) return [];
      const worst = es.sort((a, b) => a[1].d - b[1].d)[0], best = es[es.length - 1];
      const nextWorst = es[1];
      const topReg = es.slice().sort((a, b) => b[1].reg - a[1].reg)[0];
      const out = [];
      if (worst[1].d < -5) {
        const m = worst[0], e = worst[1];
        /* ⚠️ "is the biggest story in the archive" was a billing, not a
           finding — it told the reader the card mattered instead of telling
           them what it said (v14, owner's call). The shape here is a scorer
           who cannot convert, so the heading says that and the numbers stay
           in the body. */
        /* `own` (v18, owner's call): the scoring card is Hurd's Honors card
           now — *"Use this one for Hurd's honors page."* Both cards make the
           same case about the same person (scores like a champion, wins
           nothing) and the roll-call gives everyone exactly one, so this is
           the one that steps back to the You page and the profile. */
        out.push({ id: 'collapse', t: 'posc', m, w: 95, src: 'po', own: true,
          head: topReg[0] === m
            ? `${nm(m)} ${vb(m, 'outscore', 'outscores')} everyone, then ${vb(m, 'disappear', 'disappears')}.`
            : `${nm(m)} ${vb(m, 'lose', 'loses')} more scoring in the playoffs than anyone.`,
          body: `${one(e.reg)} ppg in the regular season → ${one(e.po)} in the playoffs, a ${sgn(e.d)} drop and the league's biggest. `
            + `${pl(ST.scoring[m] || 0, 'scoring title')}, ${pl(MGRS[m].f4, 'final four')}, ${MGRS[m].t1 ? pl(MGRS[m].t1, 'ring') : 'zero rings'}.` });
      }
      if (best[1].d > 4) {
        const m = best[0], e = best[1];
        out.push({ id: 'rises', t: 'posc', m, w: 55, src: 'po',
          head: `${nm(m)} ${vb(m, 'score', 'scores')} more when it counts.`,
          body: `${one(e.reg)} ppg in the regular season, ${one(e.po)} in the playoffs — ${sgn(e.d)}, the biggest rise in the league.` });
      }
      return out;
    },

    /* ── the best record nobody rewarded ────────────────────────────────── */
    function ringless() {
      const none = ALL.filter((a) => !a.t1 && a.seasons >= 8); if (!none.length) return [];
      const top = leaders(none, (a) => a.pct);
      /* ⚠️ Headings are read in a scanning column of fourteen, so a claim that
         runs to three clauses is a claim nobody reads (v14). One fact in the
         head, the evidence underneath. */
      return top.map((a) => ({ id: 'ringless', t: 'pct', m: a.m, w: 88, src: 'mix',
        head: `${nm(a.m)} ${vb(a.m, 'have', 'has')} the best win% and no title.`,
        body: (() => {
          const bs = [].concat(...SEASON.map((s) => s.rows)).filter((r) => r.mgr).sort((x, y) => y.pct - x.pct || y.pf - x.pf)[0];
          /* ⚠️ No title-bracket record here. It has its own card, and the same
             manager leading both meant "0-4 in the title bracket" printed
             twice on one screen as two separate findings — the fault the
             decimal dedupe below was written for and cannot see, because a
             W-L is two whole numbers. */
          return `${(a.pct * 100).toFixed(1)}%, the best of the ${ALL.length}, across ${pl(a.seasons, 'season')} — ${a.fin ? pl(a.fin, 'final') : 'no final'}. ` +
            `${bs.mgr === a.m ? `The best season ever recorded — ${bs.w}-${bs.l} in ${bs.yr} — finished ${ord(bs.place)}.` : ''}`;
        })() }));
    },

    /* ── most titles ────────────────────────────────────────────────────── */
    function dynasty() {
      const top = leaders(ALL.filter((a) => a.t1), (a) => a.t1); if (!top.length || top[0].t1 < 2) return [];
      /* The GOAT card. It fires for whoever leads the league in titles — the
         detector knows a SHAPE, not a person, which is the rule that stops
         this feature turning back into a hand-written page. A tie has to read
         differently: "is the GOAT discussion" is a claim about one person, so
         when it is shared the sentence says shared. */
      /* `own` (v16, owner's call): this one is a career card, not a Honors
         card — and the reason is the page it was sitting on. The Storylines
         strip opens Honors, and directly below it are the Champions card and
         the trophy case, which ARE the title count, ranked. So "4 titles" as a
         storyline told a reader something the next two screens tell them
         better, and it spent the title-holder's one slot doing it. It stays on
         that manager's own pages, where the surrounding page is about them
         rather than about the trophies.
         ⚠️ v44 moved the strip to Records, so the ADJACENCY argument above no
         longer holds — the Champions card is not underneath it any more. The
         flag stays because the owner picked which card holds his one slot
         (*"Change my honors page storyline to this actually"*), and that
         choice is about the card, not about which tab it renders on. */
      return top.map((a) => {
        const tied = tiedWith(top, a.m);
        return { id: 'dynasty', t: 'title', m: a.m, w: 80, src: 'fin', own: true,
          head: tied.length
            ? `${nm(a.m)} ${vb(a.m, 'are', 'is')} in the GOAT argument with ${pl(a.t1, 'title')}${alsoTxt(tied)}.`
            : `${nm(a.m)} ${vb(a.m, 'win', 'wins')} the GOAT argument with ${pl(a.t1, 'title')}.`,
          body: (() => {
            const next = Math.max(...ALL.filter((x) => x.m !== a.m).map((x) => x.t1));
            return `${pl(a.fin, 'final')} and ${a.po} playoff appearances in ${pl(a.seasons, 'season')}.`
              + (tied.length ? '' : ` Nobody else has more than ${pl(next, 'title')}.`);
          })() };
      });
    },

    /* ── record single-game scores ──────────────────────────────────────── */
    function bigScores() {
      const out = [];
      const p = ST.poScores[0];
      if (p && p.m) out.push({ id: 'poscore', t: 'posc', m: p.m, w: 50, src: 'po',
        head: `${nm(p.m)} ${vb(p.m, 'hold', 'holds')} the highest playoff score ever: ${one(p.v)}.`,
        body: `${p.yr}. The next best is ${one(ST.poScores[1].v)}.` });
      const c = ST.cbScore[0];
      if (c && c.m) out.push({ id: 'cbscore', t: 'cb', m: c.m, w: 44, src: 'po',
        head: `${nm(c.m)} ${vb(c.m, 'put', 'put')} up the highest Cum Bowl score ever: ${one(c.v)}.`,
        body: `${c.yr} — in a game between the two worst seeds in the league.` });
      /* Someone holding a record AND a wooden spoon is the better story. */
      const both = out.filter((x) => ST.poScores.slice(0, 2).some((y) => y.m === x.m));
      both.forEach((x) => { x.w += 15; });
      return out;
    },

    /* ── as close as anyone has come without ever getting there ─────────
       🚨 THIS CARD USED TO SAY "NEVER WON A WINNER'S-BRACKET GAME" AND THAT
       WAS FALSE (v14). Brackets existed for only 7 of 13 seasons then, and
       Wolff — the manager it fires for — reached the final four in 2017 and
       2014, which the archive could not see, so it counted six missing
       seasons as losses. ⚠️ All thirteen are on file since v57 and the
       claim would now be checkable; it is still stated as final fours,
       because that is the number that needs no caveat at all.
       v14 scoped it to the seasons on file; v19 removed the underlying stat
       altogether, because a record that needs a "seasons on file" caveat
       every time it is printed is a record that will eventually be printed
       without one. **Final fours need no caveat** — places 1-4, all 13
       seasons — so the same manager, the same shape, on a number that is
       whole: got to the last four more than anyone who has never played for
       the title. */
    function noFinal() {
      const none = ALL.filter((a) => !a.fin && a.f4);
      if (!none.length) return [];
      const top = leaders(none, (a) => a.f4);
      if (top[0].f4 < 2) return [];
      return top.map((a) => ({ id: 'nofinal', t: 'f4', m: a.m, w: 58, src: 'fin', own: true,
        head: `${nm(a.m)} ${vb(a.m, 'have', 'has')} ${pl(a.f4, 'final four')} and no final${alsoTxt(tiedWith(top, a.m))}.`,
        body: `Nobody who has never played for the title has got that close that often. ${pl(a.seasons, 'season')}, ${a.po} playoff appearances.` }));
    },

    /* ── luck, at both ends ─────────────────────────────────────────────── */
    function luck() {
      const s = [...ALL].sort((a, b) => a.luck - b.luck);
      const un = s[0], lu = s[s.length - 1];
      const out = [];
      /* 🚨 In PERCENT, not in raw records. All-play is 11 opponents a season and
         the real schedule is 13 or 14 games, so "should be 97-46, is 93-81"
         puts two different denominators side by side and reads as nonsense —
         the numbers are right and the comparison is not. */
      const pc = pct1;
      if (un.luck < -3) out.push({ id: 'unlucky', t: 'luck', m: un.m, w: 46, src: 'reg',
        head: `${nm(un.m)} ${vb(un.m, 'are', 'is')} the unluckiest team in the league.`,
        body: `Rank every team by points each season and play everyone and the scoring says ${pc(un.allPct)}; the real schedule delivered ${pc(un.pct)} — ${sgn(un.luck)} points of win%. (Rates, not records: all-play is 11 opponents a season, the real slate is 13 or 14 games.)` });
      if (lu.luck > 3) out.push({ id: 'lucky', t: 'luck', m: lu.m, w: 42, src: 'reg',
        head: `${nm(lu.m)} ${vb(lu.m, 'are', 'is')} the luckiest team in the league.`,
        body: `The scoring says ${pc(lu.allPct)}; the board says ${pc(lu.pct)} — ${sgn(lu.luck)} points of win% the schedule gave back.` });
      return out;
    },

    /* ── scoring titles with nothing to show for them ───────────────────── */
    function scorer() {
      const es = Object.entries(ST.scoring); if (!es.length) return [];
      const mx = Math.max(...es.map((e) => e[1]));
      return es.filter((e) => e[1] === mx && !MGRS[e[0]].t1).map(([m, n]) => ({
        id: 'scorer', t: 'score', m, w: 52, src: 'reg',
        head: `${nm(m)} ${vb(m, 'have', 'has')} led the league in scoring ${pl(n, 'time')} and won nothing.`,
        body: (() => { const others = tiedWith(es.filter((e) => e[1] === mx).map(([mm]) => ({ m: mm })), m);
          return others.length ? `Tied for the most with ${others.join(' and ')}.` : 'The most of anyone.'; })() }));
    },

  ];

  /* ── nobody gets an empty page ───────────────────────────────────────
     🚨 The detectors above look for extremes, so a manager who has never
     been extreme at anything gets NOTHING — and on this app that means
     three people open their own You page and find a blank space where
     everyone else has a story. That is the one outcome the whole feature
     exists to avoid.

     So: for anyone still short, find the stat they ARE most notable at —
     best or worst, whichever is further from the middle — and state it.
     Last, not first, and low-weighted, so it never displaces a real find.

     🚨 IT TOPS UP TO **TWO**, NOT TO ONE (v22, owner's call: *"Make sure
     everyone has at least 2 storylines"*). One card was the floor that
     stopped a page being blank; it is not the floor that makes a page worth
     opening. Eight of the twelve had exactly one, so eight people's own
     page was a single line — and, as ever, the eight were the ones the
     extreme-hunting detectors had least to say about.
     ⚠️ **It counts what each manager HAS, not whether they have anything.**
     The old test was `covered.has(m)` — a boolean, which cannot answer "how
     many", and which is why "at least one" was the only floor expressible.

     🚨 AND A TOP-UP MUST NOT RE-ARGUE THE CARD ABOVE IT. Every detector now
     declares a `t` topic beside its `src`, and a claim is skipped when that
     manager already holds a story on the same topic — so the manager whose
     story is "never on the podium" does not get "worst average finish" as
     their second card, which is one fact, twice, with the reader counting
     it as two. That is the v2/v15/v16 fault, and the shape it keeps coming
     back in is always a second card making the SAME case in a duller way.
     ⚠️ A detector with no `t` suppresses nothing, which fails safe — a
     possible repeat rather than a thrown error or a missing card. */
  function signature(held) {
    const pool = ALL.filter((a) => a.seasons >= 4 && (held[a.m] ? held[a.m].n : 0) < WANT);
    if (!pool.length) return [];
    const N = ALL.length;
    /* Ranked on each stat; the manager's best claim is wherever they sit
       furthest from the middle of the twelve. */
    /* 🚨 COMPETITION RANK, AND IT MUST KNOW ABOUT TIES (v58). This was
       `findIndex` on a sorted array, which is pure ARRAY POSITION: four
       managers on 5 final fours got 2nd, 3rd, 4th and 5th handed out in
       `ALL` order, and the card printed "2nd of 12" as sole possession. The
       same value produced a different sentence depending on who was reading.
       **The app's oldest storyline rule is that a superlative which fires
       twice is just wrong** (v2, which is why every real detector goes
       through `leaders()`/`alsoTxt()`) — the ordinals in this backstop were
       the one place it was never enforced.
       ⚠️ THE NEW BRACKET DATA IS WHAT EXPOSED IT: `f4` moved for eight
       managers in v56/v57 and created three fresh multi-way ties, exactly at
       the ranks this backstop fills. It was latent and wrong before; it is
       visible and wrong now. Rank is `1 + how many are strictly better`, so
       a tie shares the better rank, and `tiedOn` says whether to admit it. */
    const rankOf = (val, hiGood) => {
      const better = (x, y) => (hiGood ? val(x) > val(y) : val(x) < val(y));
      return (m) => { const me = ALL.find((x) => x.m === m);
        return 1 + ALL.filter((x) => better(x, me)).length; };
    };
    const tiedOn = (val) => (m) => { const me = ALL.find((x) => x.m === m);
      return ALL.filter((x) => val(x) === val(me)).length > 1; };
    /* ⚠️ And the rank FROM THE BOTTOM, for the same reason (v59). v57 says a
       bottom-three rank from the bottom ("second-worst"), keyed on `N - r`.
       With competition ranks a tie GROUP at the bottom shares the top of its
       range — three managers on 3 final fours are all "9th of 12" — so
       `N - r` is 3 for all of them and none reads as bottom-three, though
       together they ARE the bottom three. Counted from the bottom they are
       joint second-worst, which is both true and how a person says it. */
    const rankBottom = (val, hiGood) => {
      const worse = (x, y) => (hiGood ? val(x) < val(y) : val(x) > val(y));
      return (m) => { const me = ALL.find((x) => x.m === m);
        return 1 + ALL.filter((x) => worse(x, me)).length; };
    };
    /* 🚨 THE HEADLINE IS THE CLAIM. v7 shipped these as
       "Gotch, in one line." — a label, not a sentence — while the actual
       finding (11-1 in the consolation bracket, the best in the league) sat
       buried mid-body behind a comma. Every other card on the screen states
       its fact in the heading, so these four read as filler beside them:
       the reader scanning headings learned nothing about four of the twelve.
       **A card whose heading does not carry its finding is a card the reader
       skips.** So each claim writes its own heading, and the body is career
       context only — never a second copy of the number above it. */
    /* 🚨 A RANK NEAR THE BOTTOM IS SAID FROM THE BOTTOM (v57). "The 11th-best
       rate of the 12" is how a generator talks and "second-worst" is how a
       person does — and the clumsy form is what produced a real fault: Riz's
       card read "made the playoffs in 4 of 11 seasons" over "The 11th-best
       rate of the 12", **two different elevens, a season count and a rank,
       colliding on one card**. `checks.js` caught it (a numeral ≥3 in both
       heading and body) the moment the 2025 bracket shifted the rankings.
       ⚠️ Fixed in the two rank HELPERS, not in the card that failed — every
       claim's heading and note reads a rank through these, so the same
       collision was available to all of them. The v16 rule: fix the rule, not
       the instance. It is the v17 fault in a new costume too — two numerals
       that must not be read as one. */
    const WORSTISH = { 0: 'worst', 1: 'second-worst', 2: 'third-worst' };
    /* ⚠️ "joint" rather than "tied for": it slots in front of the word it
       qualifies without re-ordering the sentence, so every heading that
       already fits keeps fitting. */
    /* `rb` is the rank from the bottom; untied it equals `N + 1 - r`, so the
       wording is unchanged wherever nobody shares a value. */
    const bestish = (r, tie, rb = N + 1 - r) => { const b = r === 1 ? 'best'
      : WORSTISH[rb - 1] !== undefined ? WORSTISH[rb - 1] : `${ord(r)}-best`;
      return !tie ? b : r === 1 ? 'joint-best' : `joint ${b}`; };
    const rk = (r, tie, rb = N + 1 - r) => (r === 1 ? `the ${tie ? 'joint-' : ''}best in the league`
      : WORSTISH[rb - 1] !== undefined ? `the ${tie ? 'joint ' : ''}${WORSTISH[rb - 1]} in the league`
      : `${tie ? 'joint ' : ''}${ord(r)} of ${N}`);
    const CLAIMS = [
      { t: 'pct', val: (a) => a.pct, hi: true,
        head: (a, r, tie, rb) => `${nm(a.m)} ${vb(a.m, 'have', 'has')} the ${bestish(r, tie, rb)} win% in the league, ${(a.pct * 100).toFixed(1)}%.`,
        /* 🚨 BEST BY RECORD, NOT `a.best` — which is the best FINISH, and on a
           card about win% "the best of those seasons was 7-7" is simply a
           false sentence. Zach's best finish is 2nd in 2024 at 7-7; his best
           record is 9-4 in 2019, three places lower. The two disagree
           constantly in this league, which is the whole point of the archive
           (the rank is the playoff finish, the record beside it is the
           regular season) — so a card must say which one it means. */
        note: (a) => { const b = [...a.yrs].sort((x, y) => y.pct - x.pct || y.w - x.w)[0];
          return b ? `The best of those seasons was ${b.w}-${b.l} in ${b.yr}.` : ''; } },
      /* 🚨 vs the league IN THE SEASONS THEY PLAYED, never a raw career ppg.
         Scoring has climbed over thirteen years, so a raw average ranks a
         manager by which era they were in — a nine-season career that
         started late tops the all-time list without ever outscoring a
         single opponent. Same fault as comparing two different denominators
         in the luck card. That qualifier will not fit in a heading, so the
         heading states the margin and the body says what it is measured
         against — the caveat is never dropped, only moved. */
      { t: 'score', val: (a) => relPpg(a), hi: true,
        head: (a) => `${nm(a.m)} ${vb(a.m, 'have', 'has')} ${relPpg(a) >= 0 ? 'outscored' : 'trailed'} the league by ${one(Math.abs(relPpg(a)))} a game.`,
        note: (a, r, tie, rb) => `Measured against the league in the seasons ${vb(a.m, 'you', nm(a.m))} played, which is ${rk(r, tie, rb)}.` },
      /* `seasons: true` = the heading already stated the season count, so the
         body must not state it again. "…in 6 of 9 seasons" over "9 seasons,
         63-59" is one fact printed twice on one card, which is the fault the
         dedupe filter below catches for decimals and cannot see for whole
         numbers. */
      { t: 'po', val: (a) => a.poRate, hi: true, seasons: true,
        head: (a) => `${nm(a.m)} ${vb(a.m, 'have', 'has')} made the playoffs in ${a.po} of ${a.seasons} seasons.`,
        note: (a, r, tie, rb) => (r === 1 && !tie ? 'The most reliable rate in the archive.'
          : rb === 1 && !tie ? 'The least reliable rate in the archive.'
          : `The ${bestish(r, tie, rb)} rate of the ${N}.`) },
      { t: 'place', val: (a) => a.avgPlace, hi: false,
        head: (a, r, tie, rb) => `${nm(a.m)} ${vb(a.m, 'have', 'has')} the ${bestish(r, tie, rb)} average finish, ${one(a.avgPlace)}.`,
        note: (a) => (a.best && a.worst
          ? `Best ${ord(a.best.place)} in ${a.best.yr}, worst ${ord(a.worst.place)} in ${a.worst.yr}.` : '') },
      /* 🚨 THE CONSOLATION CLAIM IS GONE (v14, owner's call): "11-1 in the
         consolation bracket, the best in the league" is nine games between
         teams that were already eliminated, and putting it in a heading beside
         four titles asks the reader to weigh them against each other. The one
         consolation result anybody cares about is the Cum Bowl, and that has
         its own tab. Final fours replace it: knowable for all 13 seasons
         (places 1-4 ARE the final four in this format) and worth something. */
      { t: 'f4', val: (a) => a.f4, hi: true,
        head: (a, r, tie, rb) => (a.f4
          ? `${nm(a.m)} ${vb(a.m, 'have', 'has')} ${pl(a.f4, 'final four')}, ${rk(r, tie, rb)}.`
          : `${nm(a.m)} ${vb(a.m, 'have', 'has')} never reached the final four.`),
        note: (a) => `From ${pl(a.po, 'playoff appearance')}.` },
    ];
    /* The career line under the claim. Identical for every card about one
       manager, so only the FIRST top-up carries it — repeating "13 seasons,
       93-81, with 3 titles" under two cards on one page is the same fact
       printed twice, which is the thing this whole file keeps catching.

       🚨 AND IT DROPS ANY CLAUSE THE READER ALREADY HAS. The floor card says
       "with 2 finals and no title" and this one said "with 2 finals but no
       title" directly beneath it; the worst-to-first card says "2 of the 3
       titles" and this one added "with 3 titles". Both were invisible to the
       dedupe in `stories()`, which fingerprints DECIMALS and cannot see a
       whole number. So each clause is tested against the text of that
       manager's kept cards and dropped when it is already on the page —
       which is why `held` carries `txt` and not just a count. */
    const careerLine = (a, c, prior) => {
      const fresh = (bit) => { const n = /^\d+\s+\S+/.exec(bit); return !n || !prior.includes(n[0]); };
      const extra = [];
      if (a.t1) extra.push(pl(a.t1, 'title'));
      else if (a.fin) extra.push(`${pl(a.fin, 'final')} but no title`);
      if (a.cb) extra.push(`${pl(a.cb, 'Cum Bowl')} lost`);
      const kept = extra.filter(fresh);
      const span = pl(a.seasons, 'season');
      const lead = c.seasons ? `${a.w}-${a.l} all told`
        : prior.includes(span) ? `${a.w}-${a.l}` : `${span}, ${a.w}-${a.l}`;
      return `${lead}${kept.length ? `, with ${kept.join(' and ')}` : ''}.`;
    };
    const out = [];
    pool.forEach((a) => {
      const taken = new Set(held[a.m] ? held[a.m].t : []);
      const ranked = CLAIMS
        .filter((c) => !c.t || !taken.has(c.t))
        .map((c) => { const r = rankOf(c.val, c.hi)(a.m);
          return { c, r, tie: tiedOn(c.val)(a.m), rb: rankBottom(c.val, c.hi)(a.m), edge: Math.max(N + 1 - r, r) }; })   // distance from the middle
        .sort((x, y) => y.edge - x.edge);
      const need = WANT - (held[a.m] ? held[a.m].n : 0);
      ranked.slice(0, need).forEach((b, i) => {
        const note = b.c.note ? b.c.note(a, b.r, b.tie, b.rb) : '';
        const career = i === 0 ? careerLine(a, b.c, (held[a.m] && held[a.m].txt) || '') : '';
        out.push({ id: i ? 'sig2' : 'sig', t: b.c.t, m: a.m,
          /* Strictly below the first, so a manager's own page opens on
             their better claim and the roll-call is unaffected — every
             real detector starts at 40 and these top out at 32. */
          w: 20 + b.edge - i * 2, src: 'mix',
          head: b.c.head(a, b.r, b.tie, b.rb),
          body: `${note ? note + ' ' : ''}${career}`.trim() });
      });
    });
    return out;
  }

  /* 🚨 Built PER READER, not once at load — and this is the second time this
     exact fault has been written into this file. The first cut ran the
     detectors at module init, which is before `setMe` has been called, so
     every headline froze with the manager's own name in it and the storylines
     were the one part of the app that never said "you".

     **A value derived at init cannot answer a question asked later.** The
     detectors themselves are pure over the archive; it is only the SENTENCES
     that depend on who is reading, so the whole set is rebuilt when the reader
     changes and memoised until they do. Cheap: eighteen strings. */
  let _stCache = null, _stFor = '\u0000';
  function stories() {
    if (_stCache && _stFor === ME) return _stCache;
    const emit = (fns) => { const o = [];
      fns.forEach((fn) => { try { (fn() || []).forEach((x) => { if (x && x.m && MGRS[x.m]) o.push(x); }); } catch (_) {} });
      return o.sort((a, b) => b.w - a.w); };

    /* Drop a card whose headline number is ALREADY in a better card about the
       same person. The zero-podium card folds in whatever records that manager
       holds, which left the Cum Bowl record printed twice on one screen — two
       cards, one fact, and the reader counting it as two. */
    const seen = {};
    const keep = (list) => list.filter((x) => {
      const num = (x.head + ' ' + x.body).match(/\d+\.\d/g) || [];
      if (!num.length) return true;
      const dup = num.some((n) => (seen[x.m] || []).includes(n));
      seen[x.m] = (seen[x.m] || []).concat(num);
      return !dup;
    });

    /* 🚨 TWO PHASES, AND THE ORDER IS THE WHOLE POINT (v22). `signature` is
       the coverage backstop, so it has to count what a reader will SEE — and
       that is the list AFTER the dedupe above, not what the detectors emitted.
       Christel proved it: `cbscore` fired for him, so he counted as covered,
       and then the dedupe dropped it (its 153.6 was already quoted inside his
       zero-podium card) and left him on one card with the backstop none the
       wiser. **Assert what renders — and derive from what renders too.**
       ⚠️ This also retires `DETECT.slice(0, -1)`, which meant "every detector
       except the backstop" only for as long as the backstop stayed last in
       the array. Appending one detector below it would have silently broken
       coverage with nothing to catch it. */
    const real = keep(emit(DETECT));
    const held = {};
    real.forEach((x) => {
      const h = held[x.m] = held[x.m] || { n: 0, t: new Set(), txt: '' };
      h.n++; h.txt += ' ' + x.head + ' ' + x.body;
      if (x.t) h.t.add(x.t);
    });
    const top = keep(emit([() => signature(held)]));

    _stFor = ME;
    _stCache = real.concat(top).sort((a, b) => b.w - a.w);
    return _stCache;
  }
  const storiesFor = (m) => stories().filter((x) => x.m === m);

  /* 🚨 WHAT THE CARD SHOWS, and it is NOT just the top N.
     `stories()` ranks 18 storylines by weight and the card used to print
     `slice(0, 10)` — which covered 8 of the 12 managers. So four people
     (CC, Gotch, Hyman, Slemp) were absent from the one screen in the app that
     is a roll-call of the league, in a link handed to those same four people.
     The detectors look for EXTREMES, so the manager whose story is "solid for
     thirteen years" is exactly the one who ranks last and gets cut — the fault
     lands hardest on the people it is least fair to.
     So coverage comes FIRST: every manager's best card is taken, the rest of
     the cap is filled with the strongest remaining, and the whole selection is
     then sorted by weight for display. Everyone is in the card, and the card
     still opens on the biggest story in the league. */
  /* 🚨 `own: true` = A CAREER FOOTNOTE, NOT A LEAGUE HEADLINE (v15, owner's
     call on the 0-4 card: *"the other one is better"*). Some findings are
     worth having on the person's own page and not worth one of fourteen slots
     on the roll-call of the league — especially a second card that says the
     same thing about the same manager in a duller way. The story is still
     detected, still on that manager's You page and profile, and still in
     `_stories()`; it is only kept off the league-wide card.
     ⚠️ COVERAGE STILL BEATS THE FLAG. If a manager's ONLY story is an
     own-page one they go on the card anyway — a name missing from the
     roll-call is the worse failure, and it is the failure this whole
     selection exists to prevent (v7). */
  /* 🚨 ONE CARD PER MANAGER, and the count is the league (v16). There used to
     be a cap of 14 with the last two slots filled by the strongest leftovers —
     which twice handed one person a second card while everyone else had one,
     and both times it was a second card making the SAME case: Wolff's "best
     win%, no title" beside his "0-4 in the title bracket", then his "3 scoring
     titles and no ring". The owner caught the first one and the fix handed him
     the second. **Fixing the instance rather than the rule just moves it.**
     A roll-call reads as a roll-call: twelve people, twelve findings, ranked
     by weight so the biggest story still opens it. There is no display cap at
     all now — a thirteenth manager brings a thirteenth card, which was the
     point of the old cap being "a floor, not a ceiling". The findings that
     lose their slot are not lost: they are still on that manager's own pages.
     ⚠️ COVERAGE FIRST, ALWAYS. A manager whose only story is an own-page one
     goes on the card regardless — a name missing from the league's roll-call
     is the worse failure, and it is the failure this selection exists to
     prevent (v7). */
  function pickStories() {
    const all = stories();                 // already ranked by weight
    const best = {};
    all.forEach((x) => { if (!x.own && !best[x.m]) best[x.m] = x; });
    all.forEach((x) => { if (!best[x.m]) best[x.m] = x; });
    return Object.values(best).sort((a, b) => b.w - a.w);
  }

  /* 🚨 THE WHOLE CARD IS THE TAP TARGET (v14). Each one used to end in its own
     "Buley's career →" button — a 38px row under every card, fourteen of them,
     which is most of a phone screen spent on a link that repeats the name in
     the heading. The card was already the obvious thing to tap. Your own card
     stays a plain div: it is the one card with nowhere else to go.
     ⚠️ Nothing inside may be a button now — a button inside a button is
     invalid and the inner one is what a browser gives the tap to. */
  function storyCardHTML(s) {
    const inner = `<span class="fh-story-c">${crest(s.m, 34)}</span>
      <span class="fh-story-b">
        <b class="fh-story-h">${esc(s.head)}${tag(s.src)}</b>
        ${s.body ? `<span class="fh-story-p">${esc(s.body)}</span>` : ''}
      </span>`;
    return isMe(s.m)
      ? `<div class="fh-story fh-story-me">${inner}</div>`
      : `<button type="button" class="fh-story fh-story-go" data-mgr="${esc(s.m)}">${inner}<span class="fh-story-x">›</span></button>`;
  }

  /* ⚠️ These re-derive on every load, so the numbers in them are never stale —
     but that also means a detector that stops finding its shape simply stops
     printing. That is correct, and it is why nothing here is a fixed list. */
  function storiesHTML() {
    /* ⚠️ No lead paragraph (v14, owner's call). It said the cards are derived
       rather than typed — true, and it is now in the ? sheet, which is where a
       standing explanation belongs. Above fourteen one-line claims it was four
       lines of preamble between the reader and the first story. */
    return `<h2 class="section-title">📌 Storylines</h2>
    <div class="ffp-card fh-stories">
      ${pickStories().map(storyCardHTML).join('')}
    </div>`;
  }

  /* ══ 📖 SEASON BY SEASON — all 13, newest first ═══════════════════════ */
  function seasonsHTML() {
    return `<h2 class="section-title">📖 Season by season ${tag('fin')}</h2>
    ${SEASON.map((s, i) => `<details class="ffp-card fh-det"${i === 0 ? ' open' : ''}>
      <summary><b>${s.yr}</b><span>${esc(nm(s.champ.mgr) || s.champ.t)} 🏆</span>${s.platform === 'sleeper' ? '<em class="fh-plat">SLEEPER</em>' : ''}<i>▾</i></summary>
      <div class="fh-tbl-h s4"><span>#</span><span>TEAM</span><span>REC</span><span>PF</span></div>
      <p class="fh-tbl-k"><b>#</b> = playoff finish · <b>REC</b> and <b>PF</b> = regular season</p>
      ${s.rows.map((r, j) => `<div class="fh-tr s4${isMe(r.mgr) ? ' you' : ''}${r.place && r.place < 4 ? ' pod' : ''}${r.tie ? ' tie' : ''}">
        <span class="fh-tr-n">${r.tie ? (r.tie.split('-')[0] === String(j + 1) ? r.tie : '') : j + 1}</span>
        <span class="fh-tr-t">${tap(r.mgr, who(r))}</span>
        <span class="fh-tr-r mono">${rec(r)}</span>
        <span class="fh-tr-r mono dim">${Math.round(r.pf)}</span>
      </div>`).join('')}
      ${s.tieNote || (s.rows.some((r) => r.tie) ? '<p class="ffp-cap">The 9th/10th and 11th/12th placement games are missing from the export, so those pairs are shown unordered rather than guessed.</p>' : '')}
    </details>`).join('')}`;
  }

  /* ══ 🚽 THE CUM BOWL ══════════════════════════════════════════════════ */
  function cumbowlHTML() {
    const played = [...ALL].filter((a) => a.cbA).sort((a, b) => b.cbA - a.cbA || b.cb - a.cb);
    const never = ALL.filter((a) => !a.cbA);
    const surprises = CUMBOWL.filter((c) => {
      const s = SEASON.find((x) => x.yr === c.yr); if (!s || !s.fin || s.lastKnown === false) return false;
      return s.rows[s.rows.length - 1].t === cbWinner(c);
    });
    return `<h2 class="section-title">🚽 The Cum Bowl ${tag('po')}</h2>
    <div class="ffp-card">
      <p class="fh-lead">The two worst seeds play on the first weekend of the playoffs. <b>The loser is the league's worst.</b></p>
      <div class="fh-cbt-h"><span>Record</span><span>PLAYED</span><span>LOST</span></div>
      ${played.map((a) => `<div class="fh-cbt-r${isMe(a.m) ? ' you' : ''}">
        ${tap(a.m, `<b>${esc(a.name)}</b>`)}<span>${a.cbA}</span><span class="${a.cb ? 'neg' : 'pos'}">${a.cb || '0'}</span>
      </div>`).join('')}
      ${never.length ? `<div class="fh-cbt-n"><b>Never a bottom-two seed:</b> ${never.map((a) => esc(a.name)).join(' · ')}</div>` : ''}
    </div>
    <details class="ffp-card fh-det">
      <summary><b>Every game</b><span>${CUMBOWL.length} seasons</span><i>▾</i></summary>
      <div class="fh-cb-wrap">
      ${CUMBOWL.map((c) => {
        const s = SEASON.find((x) => x.yr === c.yr);
        const lose = cbLoser(c), win = cbWinner(c);
        const r = (t, p, seed) => { const row = s.rows.find((x) => x.t === t) || { t, mgr: mgrOf(t) };
          return `<div class="fh-cb-r${t === win ? ' w' : ' lose'}"><i>${seed}</i>${tap(row.mgr, who(row))}<u>${p.toFixed(1)}</u>${t === lose ? '<em>🚽</em>' : ''}</div>`; };
        const wonAndLast = s.fin && s.lastKnown !== false && s.rows[s.rows.length - 1].t === win;
        return `<div class="fh-cb">
          <span class="fh-cb-y">${c.yr}${s.worst ? '<i class="fh-recon">recon</i>' : ''}</span>
          <div class="fh-cb-g">${r(c.s12, c.p12, 12)}${r(c.s11, c.p11, 11)}
          ${wonAndLast ? '<div class="fh-cb-x wl">⚠️ won it and still finished 12th</div>' : ''}</div>
        </div>`;
      }).join('')}
      </div>
      <p class="ffp-cap"><b>Winning does not always save you</b> — in ${surprises.length} season${surprises.length === 1 ? '' : 's'} the Cum Bowl winner still finished 12th, because the consolation bracket keeps running afterwards. <b>2025 is marked <i>recon</i></b>: Sleeper never paired #11 v #12, so the two worst seeds are taken head-to-head on their real week-15 scores.</p>
    </details>`;
  }

  /* ══ 🏈 YOUR CAREER ═══════════════════════════════════════════════════ */
  function youHTML() {
    const a = MGRS[ME];
    /* 🚨 Nobody picked → this tab must say what it needs, not render blank.
       In Sports-Hub this returned '' because there was exactly one reader and
       he was always known. Here a blank panel is the likeliest first thing a
       league member ever sees. */
    if (!a) {
      return `<h2 class="section-title">${mascot(null)} Your career</h2>
      <div class="ffp-card"><div class="ffp-empty"><b>Tell the app who you are.</b>
      Pick your name and this page becomes your thirteen seasons — every finish, your
      medals, your final fours and your Cum Bowls. Everything else on the app starts
      calling you <i>you</i> at the same time.</div>
      <button type="button" class="fan-btn" data-pickme="1">👤 Choose my name</button></div>`;
    }
    const mine = storiesFor(ME);
    return `<h2 class="section-title">${mascot(ME)} Your career ${tag('mix')}</h2>
    ${careerCard(a, true)}
    ${mine.length ? `<h2 class="section-title">📌 Your storylines</h2>
    <div class="ffp-card fh-stories">${mine.map(storyCardHTML).join('')}</div>` : ''}
    ${h2hFor(ME).length ? `<h2 class="section-title">Your playoff head-to-head ${tag('po')}</h2>
    <div class="ffp-card">
      ${h2hFor(ME).map((v) => `<div class="fh-h2h">${tap(v.opp, `<b>${esc(nm(v.opp))}</b>`)}<i>${one(v.pf)}–${one(v.pa)}</i><span class="${v.w > v.l ? 'pos' : v.l > v.w ? 'neg' : ''}">${v.w}-${v.l}</span></div>`).join('')}
      <p class="ffp-cap">⚠️ <b>Every playoff meeting, not a record.</b> This counts all ${h2hFor(ME).reduce((n, v) => n + v.n, 0)} games on file against these people — every bracket, including the placement games and the consolation ladder. Winning those decides nothing, which is why the app keeps no bracket record — but a meeting is still a meeting. There is no regular-season schedule in the archive, so this is not a career head-to-head. Points are per-game averages.</p>
    </div>` : ''}
    <h2 class="section-title">Your franchises</h2>
    <div class="ffp-card"><div class="fh-fr-list">${[...new Set([...a.yrs].sort((x, y) => y.yr - x.yr).map((r) => r.t))].map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>`;
  }

  /* Shared by the You tab and every manager profile. */
  function careerCard(a, full) {
    const yrs = [...a.yrs].sort((x, y) => x.yr - y.yr);
    const cls = (r) => (r.place === 1 ? 'g' : r.place === 2 ? 's' : r.place === 3 ? 'b' : r.place && r.place > 9 ? 'l' : '');
    const bestPf = [...a.yrs].sort((x, y) => y.ppg - x.ppg)[0];
    return `<div class="ffp-card">
      <div class="fh-car">${yrs.map((r) => `<div class="fh-car-c ${cls(r)}" title="${r.yr} — ${r.place ? ord(r.place) : '?'}">
        <b>${r.place === 1 ? '🏆' : r.place || '·'}</b><i>'${String(r.yr).slice(2)}</i></div>`).join('')}</div>
      <div class="fh-car-l">
        <span><b>${a.t1}</b>titles</span><span><b>${a.t2}</b>silver</span>
        <span><b>${a.t3}</b>bronze</span><span><b>${a.w}-${a.l}</b>reg. season</span>
      </div>
      ${full ? `<div class="fh-you-g">
        ${[['Avg finish', one(a.avgPlace)], ['Playoff apps', `${a.po}/${a.seasons}`], ['Points/gm', one(a.ppg)],
           ['vs league', sgn(a.ppg - LEAGUE_PPG)], ['Final fours', `${a.f4}/${a.seasons}`], ['Luck', sgn(a.luck)]]
          .map(([k, v]) => `<div class="fh-you-t"><b>${v}</b><i>${k}</i></div>`).join('')}
      </div>` : ''}
      ${full ? '<p class="ffp-cap">Squares are the <b>playoff finish</b>; the totals under them are the <b>regular season</b>. <b>Final fours</b> is places 1-4 — the four teams left after round one, which the final placings give for every season.</p>' : ''}
      <div class="fh-car-f">
        <span><b>Best</b> ${bestPf.yr} · ${one(bestPf.ppg)} per game · finished ${bestPf.place ? ord(bestPf.place) : '?'}</span>
        <span><b>Worst</b> ${a.worst.yr} · ${ord(a.worst.place)} · ${rec(a.worst)}</span>
      </div>
    </div>`;
  }

  /* ══ MANAGER PROFILE — the drill-down every name opens ════════════════ */
  function profileHTML(m) {
    const a = MGRS[m]; if (!a) return '<div class="fh-empty">Unknown manager</div>';
    const pairs = h2hFor(m);
    const teams = [...new Set([...a.yrs].sort((x, y) => y.yr - x.yr).map((r) => r.t))];
    return `<div class="fh-prof">
      <div class="fh-prof-h">${crest(m, 66)}
        <div><h3>${mascot(m)} ${esc(a.name)}</h3><p>${a.seasons} seasons · ${a.w}-${a.l} · ${one(a.ppg)} per game</p></div>
      </div>
      <div class="fh-prof-m"><span>${a.t1} 🥇 · ${a.t2} 🥈 · ${a.t3} 🥉 · ${a.cb} 🚽 · ${a.po} playoffs · ${sgn(a.luck)} luck</span></div>
      ${careerCard(a, true)}
      ${storiesFor(m).length ? `<h2 class="section-title">📌 Storylines</h2>
    <div class="ffp-card fh-stories">${storiesFor(m).map(storyCardHTML).join('')}</div>` : ''}
    ${pairs.length ? `<h2 class="section-title">Playoff head-to-head ${tag('po')}</h2>
      <div class="ffp-card">
        ${pairs.map((v) => `<div class="fh-h2h">${tap(v.opp, `<b>${esc(nm(v.opp))}</b>`)}<i>${one(v.pf)}–${one(v.pa)}</i><span class="${v.w > v.l ? 'pos' : v.l > v.w ? 'neg' : ''}">${v.w}-${v.l}</span></div>`).join('')}
        <p class="ffp-cap">⚠️ <b>Every playoff meeting, not a record.</b> All ${pairs.reduce((n, v) => n + v.n, 0)} games on file — every bracket, including the placement games and the consolation ladder, which decide nothing and are kept as meetings rather than as a record. No regular-season schedule exists in the archive, so this is not a career head-to-head. Points are per-game averages.</p>
      </div>` : ''}
      <h2 class="section-title">Franchises</h2>
      <div class="ffp-card"><div class="fh-fr-list">${teams.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>
    </div>`;
  }

  /* 🚨 ONE abbreviation set for BOTH axes. The first cut put 3-letter codes on
     the columns and CSS-truncated full names on the rows, so the two halves of
     one table named the same twelve people two different ways — and the row
     ellipsis collapsed Woods/Wolff to "W…" and Hyman/Hurd to "H…". A label that
     cannot identify its own row is the "CC CC" fault (v208). */
  const ab = (m) => nm(m).slice(0, 3);
  const PAIRC = (ALL.length * (ALL.length - 1)) / 2;

  /* ⚠️ There was a `KIND` label map here — '🏆 final', 'title bracket',
     'consolation' — and NOTHING RENDERED IT. Dead since individual meetings
     stopped being listed; it never ran, so no test could see it, and v19
     dutifully updated its wording before noticing. Same shape as the `STATS`
     array deleted in v8. Deleted. `kind` itself stays: `fin` is read when a
     rivalry line counts how many of the meetings were finals. */

  function rivalsHTML() {
    const top = PAIRS.filter((p) => p.n >= 3);
    const unbeaten = PAIRS.filter((p) => p.n >= 3 && (p.aw === 0 || p.bw === 0));
    const order = [...ALL].sort((a, b) => b.t1 - a.t1 || b.pct - a.pct);
    const cell = (x, y) => {
      if (x.m === y.m) return '<td class="fh-gx"></td>';
      const k = [x.m, y.m].sort().join('|'), e = H2H[k];
      if (!e) return '<td class="fh-g0">·</td>';
      const [w, l] = e.a === x.m ? [e.aw, e.bw] : [e.bw, e.aw];
      return `<td class="fh-gc ${w > l ? 'w' : l > w ? 'l' : 'd'}"><b>${w}</b><i>${l}</i></td>`;
    };
    return `<h2 class="section-title">⚔️ Rivalries ${tag('po')}</h2>
    <div class="ffp-card">
      <p class="fh-lead"><b>${MEET.length} meetings</b> on record between <b>${PAIRS.length} of ${PAIRC}</b> possible pairs — ${PAIRC - PAIRS.length} pairs have never met in a playoff game.</p>
      <div class="fh-sub">Most-played</div>
      ${top.slice(0, 6).map((p) => {
        const [hi, lo] = p.aw >= p.bw ? [p, 1] : [p, -1];
        const lead = p.aw > p.bw ? p.a : p.bw > p.aw ? p.b : null;
        return `<div class="fh-rv">
          <div class="fh-rv-n">${tap(p.a, `<b class="${lead === p.a ? 'up' : ''}">${esc(nm(p.a))}</b>`)}<span>v</span>${tap(p.b, `<b class="${lead === p.b ? 'up' : ''}">${esc(nm(p.b))}</b>`)}</div>
          <div class="fh-rv-s"><b>${p.aw}–${p.bw}</b><i>${p.n} games · ${one(p.ap / p.n)}–${one(p.bp / p.n)} avg</i></div>
        </div>`;
      }).join('')}
      ${unbeaten.length ? `<div class="fh-sub">Perfect records</div>
      ${unbeaten.map((p) => { const w = p.aw > p.bw ? p.a : p.b, l = p.aw > p.bw ? p.b : p.a, n = Math.max(p.aw, p.bw);
        const fins = (p.games || []).filter((g) => g.kind === 'fin').length;
        return `<div class="fh-rv perfect">
          <div class="fh-rv-n">${tap(w, `<b class="up">${esc(nm(w))}</b>`)}<span>owns</span>${tap(l, `<b>${esc(nm(l))}</b>`)}</div>
          <div class="fh-rv-s"><b class="pos">${n}–0</b><i>${fins ? `${fins} of them a final` : `${n} meetings`}</i></div>
        </div>`; }).join('')}` : ''}
      <p class="ffp-cap">⚠️ <b>Every playoff meeting.</b> The archive has final standings and playoff brackets — <b>no regular-season schedule</b> — so these are championship, placement, consolation and Cum Bowl games, not career head-to-head. Sample sizes are ${Math.min(...PAIRS.map((p) => p.n))}–${Math.max(...PAIRS.map((p) => p.n))} games: read them as stories, not settled arguments.</p>
    </div>
    <details class="ffp-card fh-det">
      <summary><b>The full grid</b><span>every pair</span><i>▾</i></summary>
      <div class="fh-grid-wrap"><table class="fh-grid"><thead><tr><th></th>${order.map((y) => `<th title="${esc(nm(y.m))}">${esc(ab(y.m))}</th>`).join('')}</tr></thead>
      <tbody>${order.map((x) => `<tr><th title="${esc(nm(x.m))}">${esc(ab(x.m))}</th>${order.map((y) => cell(x, y)).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="ffp-cap">Read across: wins on top, losses beneath. <b>·</b> = never met in a playoff game. Swipe the grid sideways for the last few columns — the names stay pinned.</p>
    </details>`;
  }

  /* the profile's h2h, over the full meeting pool — 210 since v57 */
  function h2hFor(m) {
    const out = [];
    Object.values(H2H).forEach((e) => {
      if (e.a !== m && e.b !== m) return;
      const me = e.a === m, opp = me ? e.b : e.a;
      out.push({ opp, w: me ? e.aw : e.bw, l: me ? e.bw : e.aw, n: e.n,
        pf: (me ? e.ap : e.bp) / e.n, pa: (me ? e.bp : e.ap) / e.n,
        games: e.games.map((g) => ({ ...g, mine: me ? g.xs : g.ys, theirs: me ? g.ys : g.xs })) });
    });
    return out.sort((a, b) => b.n - a.n || (b.w - b.l) - (a.w - a.l));
  }
  /* ── The public surface. app.js knows these five keys and nothing else. ── */
  /* ⚠️ DISPLAY ORDER, and it is this array alone (v45, owner's call: You
     first, Honors second). `VIEWS` is a map and `league.js` just walks this,
     so a reorder needs no other edit — the sub-tab bar, the ? sheet's tab list
     and `checks.js` all read it. ⚠️ What a reorder does NOT decide is which
     tab the app LANDS on: `league.js` lands a reader who has picked on `you`
     and everybody else on `hon`, because the You page with nobody picked is an
     invitation card and a stranger must get a whole app. */
  /* ⚠️ The LABEL is "Honors" (v47, owner's call) and the KEY stays `hon`.
     Renaming the key would have been a second edit in `VIEWS`, in `HELP`, in
     `S.sub`'s default and in every comment that names a view — for a word on
     screen. The label is the only thing a reader sees, and `checks.js`, the
     sub-tab bar and the ? sheet's tab list all read it from here.
     ⚠️ Older comments and changelog entries say "Honors": same tab. */
  const SUBS = [['you', 'You'], ['hon', 'Honors'], ['rec', 'Records'],
                ['cb', 'Cum Bowl'], ['sea', 'Seasons']];
  const VIEWS = {
    /* 🚨 Storylines opens RECORDS (v44, owner's call), back where it lived
       before v13. v13 moved it to Honors on the reasoning that it was the
       best thing the archive produces and was buried third-of-five — that
       argument was about REACH, and reach is no longer the problem: the ?
       sheet names it and the jump nav on Records chips straight to it. What
       Honors lost by holding it is that the page is now the champions, the
       trophy case and who is waiting — three views of the same trophy —
       while Records is the page of derived findings, which is what a
       storyline IS. ⚠️ It is ONE TERM, moved: nothing else about the feature
       changes, and `LH.SUBS` order is untouched. */
    /* ⚠️ Card order on Honors is this line (v46, owner's call: the trophy
       case first, Champions second). Neither card's copy refers to the other's
       position and the jump nav reads the rendered DOM, so a swap is this one
       term — but `heroHTML()` stays first: it is the page's standfirst and
       stat strip, not one of the cards, and it carries no heading so it is not
       a jump chip either. */
    /* ⚠️ The champion's curse closes the page, UNDER final fours (v50, owner's
       call: *"Put champions curse below that"*). It belongs with these four
       rather than among the Records leaderboards: it is about what happens to
       a CHAMPION, and Honors is where the champions are. Self-contained — its
       copy names no neighbour — so this is one term moved out of `rec`. */
    hon: () => heroHTML() + trophyHTML() + champsHTML() + ringlessHTML() + finalFoursHTML() + curseHTML(),
    sea: () => seasonsHTML(),
    /* Playoff record + Finals reached sit HERE, not on Cum Bowl (v9, owner's
       call). They are career résumé — who gets in, who reaches the final —
       and the Cum Bowl is the opposite bracket, for the teams that missed.
       Filing them there put the league's best achievement behind the tab
       named for its worst. Ordered baseline-first: who makes the playoffs,
       then the two cards that comment on what happens once you are in. */
    /* ⚠️ ORDER IS THE OWNER'S CALL (v51: "move luck index and rivalries to
       bottom of records"). The page runs findings → the record book → the
       playoff cards → the two pairwise/derived cards last. Nothing reads this
       order but the page itself; the jump nav is built from the rendered DOM,
       so the chips re-order with no second edit.
       ⚠️ `curseHTML()` is NOT here — it closes Honors instead (the owner's
       other call, landed in parallel). Both moves are his and they compose:
       this one says where luck and rivalries sit, that one says the curse is
       an honour. Merged rather than either one winning. */
    rec: () => storiesHTML() + recordHTML() + playoffHTML() + seedHTML() + januaryHTML() + luckHTML() + rivalsHTML(),
    cb: () => cumbowlHTML(),
    you: () => youHTML(),
  };
  window.LeagueHistory = {
    SUBS,
    /* Identity. `setMe` re-voices every view; `roster` is what the name
       picker is built from — the twelve TRACKED managers, so the two
       untracked ones can never be chosen (they have no career to show). */
    setMe: (m) => setMe(m),
    me: () => ME,
    name: (m) => realNm(m),
    roster: () => [...ALL].sort((a, b) => realNm(a.m).localeCompare(realNm(b.m)))
      .map((a) => ({ m: a.m, name: realNm(a.m), logo: a.logo, seasons: a.seasons, t1: a.t1 })),
    view: (k) => (VIEWS[k] || VIEWS.hon)(),
    profile: (m) => profileHTML(m),
    /* The three-badge key, for the ? sheet `league.js` builds. Derived here so
       the counts in it can never be a stale copy of the archive. */
    key: () => keyHTML(),
    /* ── 📊 what the CURRENT season needs from the archive (v39) ────────────
       `season.js` puts this year against the reader's other thirteen, and it
       must not reach into `_stats` to do it — that is the checks' handle, not
       an API. So the two things it actually needs are exposed deliberately:
       a career, and the voice.

       🚨 EVERY SCORING FIGURE HERE IS RELATIVE TO THAT SEASON'S LEAGUE, never
       raw. Scoring has climbed across thirteen years, so "your 118.4 ppg is
       the best of your career" is a sentence that would be true for almost
       any current season regardless of how the reader is playing — it ranks
       seasons by WHEN they happened. `rel` is the same era-safe measure the
       storyline detectors use (`relPpg`): points a game against the league
       that same year. Compare `rel` to `rel` and the eras cancel.

       ⚠️ Season-level only, because that is all the archive holds. There are
       no week-by-week scores before this year, so nothing built on this can
       say "your best START" or "you have never lost three in a row" — those
       are facts about a shape the data does not have. */
    career: (m) => {
      const a = MGRS[m];
      if (!a) return null;
      return {
        m: a.m, name: nm(a.m), real: realNm(a.m),
        seasons: a.seasons, w: a.w, l: a.l, pct: a.pct, luck: a.luck,
        t1: a.t1, t2: a.t2, po: a.po, f4: a.f4, avgPlace: a.avgPlace,
        best: a.best ? { yr: a.best.yr, place: a.best.place } : null,
        worst: a.worst ? { yr: a.worst.yr, place: a.worst.place } : null,
        yrs: a.yrs.map((r) => {
          const s = SEASON.find((x) => x.yr === r.yr);
          return { yr: r.yr, w: r.w, l: r.l, place: r.place,
            games: r.w + r.l, rel: s ? r.ppg - s.lgPpg : 0 };
        }).sort((x, y) => x.yr - y.yr),
      };
    },
    /* 🚨 The voice, so a generated sentence about the current season agrees
       with the person reading it. `vb` exists because second person changes
       the verb — "you have outscored" but "Buley has outscored" — and a
       sentence that agrees with the wrong person is the first thing a reader
       notices. Any new sentence about a manager goes through it. */
    voice: { nm: (m) => nm(m), vb: (m, second, third) => vb(m, second, third) },
    /* Exposed for the repo's own checks — nothing in the app reads these. */
    _stats: { SEASON, ALL, MEET, PAIRS, CUMBOWL, PLAYOFF_GAMES },
    _stories: () => stories(),
    _cardStories: () => pickStories(),
  };
})();
