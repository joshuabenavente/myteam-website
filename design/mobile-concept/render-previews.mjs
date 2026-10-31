import fs from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require('C:/Users/soapo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const brand = fs.readFileSync(new URL('./wordmark.svg', import.meta.url), 'utf8')
const brandInside = brand.replace(/^.*?<svg[^>]*>/s, '').replace(/<\/svg>\s*$/, '')
const logos = Object.fromEntries(['den','gs'].map(name => [name,
  `data:image/png;base64,${fs.readFileSync(new URL(`./assets/${name}.png`, import.meta.url)).toString('base64')}`]))
let showLogos = false

const W = 900, H = 880
const ink = '#eef3fa', sub = '#aeb9c8', blue = '#a8c7ff', navy = '#0e2240', gold = '#fec524', line = '#2c3747'
const R = (x,y,w,h,fill,r=0,stroke='none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`
const T = (x,y,s,size=14,color=ink,weight=400,anchor='start') => `<text x="${x}" y="${y}" font-family="Segoe UI,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${s}</text>`
const L = (x1,y1,x2,y2,color=line) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}"/>`
const mark = (x,y) => `<svg x="${x}" y="${y}" width="151" height="27" viewBox="25 28 751 122">${brandInside}</svg>`
const badge = (x,y,size,team,label,fill,textColor=navy) => showLogos
  ? `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${logos[team]}"/>`
  : R(x,y,size,size,fill,Math.round(size*.27))+T(x+size/2,y+size*.66,label,17,textColor,800,'middle')
const portrait = (x,y,size,initial,fill='#2b3d56') => R(x,y,size,size,fill,size/2)+T(x+size/2,y+size*.63,initial,size*.33,fill===gold?navy:'#d3e3ff',800,'middle')
function phone(x,title,body,heroHeight=275){
  const y=22, w=390, h=830
  return `<g>
    ${R(x,y,w,h,'#05080d',43)}${R(x+8,y+8,w-16,h-16,'#0b1018',36)}
    <clipPath id="clip${x}"><rect x="${x+8}" y="${y+8}" width="${w-16}" height="${h-16}" rx="36"/></clipPath>
    <g clip-path="url(#clip${x})">
      ${R(x+8,y+8,w-16,heroHeight,'#0e2240')}
      <g opacity=".7" filter="url(#blur)"><ellipse cx="${x+285}" cy="${y+100}" rx="180" ry="38" fill="#245fe5" transform="rotate(-18 ${x+285} ${y+100})"/><ellipse cx="${x+315}" cy="${y+159}" rx="180" ry="30" fill="#96b6f7" transform="rotate(-18 ${x+315} ${y+159})"/><ellipse cx="${x+352}" cy="${y+213}" rx="135" ry="22" fill="#fec524" transform="rotate(-18 ${x+352} ${y+213})"/></g>
      <rect x="${x+8}" y="${y+8}" width="${w-16}" height="${heroHeight}" fill="url(#veil)"/>
      ${mark(x+28,y+35)}${R(x+262,y+34,103,34,'#ffffff25',17,'#ffffff65')}${showLogos?`<image x="${x+269}" y="${y+39}" width="24" height="24" href="${logos.den}"/>`:R(x+269,y+39,24,24,gold,12)+T(x+281,y+56,'DN',11,navy,800,'middle')}${T(x+301,y+56,'Nuggets',12,'#fff',700)}
      ${body(x,y)}
      ${R(x+8,y+755,w-16,80,'#fff')}${L(x+8,y+755,x+w-8,y+755)}
      ${T(x+106,y+790,'▦',22,title==='Players'||title==='Player'?'#9daec4':gold,700,'middle')}${T(x+106,y+809,'Games',11,title==='Players'||title==='Player'?'#9daec4':gold,700,'middle')}
      ${T(x+287,y+790,'♟',22,title==='Players'||title==='Player'?gold:'#9daec4',700,'middle')}${T(x+287,y+809,'Players',11,title==='Players'||title==='Player'?gold:'#9daec4',700,'middle')}
    </g>${R(x+145,y+8,100,22,'#05080d',0)}
  </g>`
}
function section(x,y,title,right=''){return T(x,y,title,19,ink,700)+T(x+336,y,right,11,sub,500,'end')}
function row(x,y,date,opp,meta,right,small){return R(x,y,334,68,'#fff',14,line)+T(x+20,y+25,date,17,ink,700)+L(x+65,y+10,x+65,y+58)+T(x+80,y+27,opp,14,ink,700)+T(x+80,y+46,meta,11,sub)+T(x+318,y+27,right,14,ink,700,'end')+T(x+318,y+46,small,11,sub,400,'end')}
function metric(x,y,value,label){return R(x,y,102,82,'#fff',14,line)+T(x+51,y+40,value,23,ink,700,'middle')+T(x+51,y+62,label,10,sub,700,'middle')}
const gamesBody=(x,y)=>`
  ${T(x+28,y+102,'DENVER NUGGETS · 2026–27 · CONCEPT',10,'#f6ca4e',800)}
  ${T(x+28,y+143,'Games',35,'#fff',700)}${T(x+28,y+165,'The next tip, then everything else.',13,'#d6e1f4')}
  ${badge(x+28,y+188,44,'den','DN',gold)}${T(x+86,y+216,'vs',12,'#d6e1f4',700)}${badge(x+108,y+188,44,'gs','GS','#fdb927','#183a66')}${T(x+346,y+207,'Mon · 8:00 PM',16,'#fff',700,'end')}${T(x+346,y+227,'Oct 26 · Home',11,'#d6e1f4',400,'end')}
  ${R(x+28,y+251,334,47,'#fff',13)}${T(x+43,y+280,'Warriors at Nuggets',14,navy,700)}${T(x+346,y+280,'↗',21,navy,400,'end')}
  ${section(x+28,y+332,'Recent results','Regular season')}
  ${row(x+28,y+346,'24','vs Pelicans','Home · Final','W 141–135','Box score →')}
  ${row(x+28,y+420,'22','at Thunder','Away · Final','L 84–96','Box score →')}
  ${section(x+28,y+527,'Coming up','Oct–Nov')}
  ${row(x+28,y+542,'28','at Pelicans','Wednesday · Away','6:00 PM','MDT')}
  ${row(x+28,y+616,'30','at Suns','NBA Cup · West Group A','8:00 PM','MDT')}
  ${T(x+28,y+720,'Published data: Oct 25, 2026 · 8:24 AM MDT',11,sub)}
  ${T(x+28,y+738,'Live scores refresh separately during games.',11,sub)}`
const detailBody=(x,y)=>`
  ${T(x+28,y+104,'‹  Games',14,'#fff',700)}${T(x+347,y+104,'REGULAR SEASON',10,'#d6e1f4',700,'end')}
  ${T(x+28,y+144,'MONDAY · OCT 26 · DENVER',10,'#f6ca4e',800)}
  ${badge(x+46,y+170,53,'gs','GS','#fdb927','#183a66')}${badge(x+290,y+170,53,'den','DN',gold)}
  ${T(x+73,y+245,'Warriors',15,'#fff',700,'middle')}${T(x+316,y+245,'Nuggets',15,'#fff',700,'middle')}
  ${T(x+195,y+190,'SCHEDULED',10,'#f6ca4e',800,'middle')}${T(x+195,y+217,'8:00',23,'#fff',700,'middle')}${T(x+195,y+236,'PM MDT',10,'#d6e1f4',700,'middle')}
  ${T(x+28,y+274,'Peacock · NBC Sports Network · Altitude+',11,'#d6e1f4')}
  ${R(x+28,y+310,334,43,'#e9edf3',12)}${R(x+32,y+314,106,35,'#fff',9)}${T(x+85,y+337,'Preview',12,navy,700,'middle')}${T(x+195,y+337,'Box score',12,sub,700,'middle')}${T(x+303,y+337,'Plays',12,sub,700,'middle')}
  ${section(x+28,y+388,'Before tip','What to know')}
  ${R(x+28,y+404,161,93,'#fff',14,line)}${T(x+43,y+429,'TIP-OFF',10,sub,700)}${T(x+43,y+457,'8:00 PM MDT',16,ink,700)}${T(x+43,y+477,'Monday, Oct 26',11,sub)}
  ${R(x+201,y+404,161,93,'#fff',14,line)}${T(x+216,y+429,'WATCH',10,sub,700)}${T(x+216,y+457,'Peacock',16,ink,700)}${T(x+216,y+477,'Altitude+ local',11,sub)}
  ${R(x+28,y+506,161,93,'#fff',14,line)}${T(x+43,y+531,'VENUE',10,sub,700)}${T(x+43,y+559,'Ball Arena',16,ink,700)}${T(x+43,y+579,'Denver, Colorado',11,sub)}
  ${R(x+201,y+506,161,93,'#fff',14,line)}${T(x+216,y+531,'SERIES',10,sub,700)}${T(x+216,y+559,'First meeting',16,ink,700)}${T(x+216,y+579,'2026–27 season',11,sub)}
  ${section(x+28,y+638,'Availability','Check near tip-off')}
  ${R(x+28,y+653,334,75,'#fff',14,line)}${T(x+43,y+679,'The injury report appears here',13,sub)}${T(x+43,y+700,'with its own update time.',13,sub)}`
const playersBody=(x,y)=>`
  ${T(x+28,y+105,'DENVER NUGGETS · 2026–27 · CONCEPT',10,'#f6ca4e',800)}
  ${T(x+28,y+146,'Players',35,'#fff',700)}${T(x+28,y+171,'Find a player. See the season in context.',13,'#d6e1f4')}
  ${R(x+28,y+231,334,46,'#fff',12,line)}${T(x+45,y+260,'⌕  Search players',14,sub)}
  ${T(x+28,y+306,'Regular season · 5 players',12,sub)}${T(x+362,y+306,'Per game ⌄',12,blue,700,'end')}
  ${playerRow(x+28,y+326,'NJ','Nikola Jokić','#15 · C','24.0')}
  ${playerRow(x+28,y+397,'JM','Jamal Murray','#27 · PG','24.0')}
  ${playerRow(x+28,y+468,'AG','Aaron Gordon','#32 · PF','13.5')}
  ${playerRow(x+28,y+539,'DD','DeMar DeRozan','#10 · SF','12.5')}
  ${playerRow(x+28,y+610,'CB','Christian Braun','#0 · SG','11.0')}
  ${T(x+28,y+719,'Published data: Oct 25, 2026 · 8:24 AM MDT',11,sub)}
  ${T(x+28,y+738,'Open Jokić for stats and season comparisons.',11,sub)}`
function playerRow(x,y,initial,name,meta,pts){return R(x,y,334,66,'#fff',13,line)+portrait(x+14,y+13,40,initial)+T(x+66,y+29,name,14,ink,700)+T(x+66,y+47,meta,11,sub)+T(x+319,y+30,pts,17,ink,700,'end')+T(x+319,y+47,'PTS / G',10,sub,700,'end')}
const playerBody=(x,y)=>`
  ${T(x+28,y+105,'‹  Players',14,'#fff',700)}${T(x+350,y+105,'#15 · CENTER',10,'#d6e1f4',700,'end')}
  ${portrait(x+28,y+126,62,'NJ',gold)}
  ${T(x+104,y+143,'DENVER NUGGETS',10,'#f6ca4e',800)}${T(x+104,y+169,'Nikola Jokić',28,'#fff',700)}${T(x+104,y+189,'2026–27 · 2 games',11,'#d6e1f4')}
  ${section(x+28,y+257,'Season pace','Per game')}
  ${metric(x+28,y+272,'24.0','POINTS')}${metric(x+144,y+272,'11.0','REBOUNDS')}${metric(x+260,y+272,'7.5','ASSISTS')}
  ${section(x+28,y+399,'Compare seasons')}
  ${R(x+28,y+416,334,43,'#e9edf3',12)}${R(x+32,y+420,160,35,'#fff',9)}${T(x+112,y+443,'Same point',12,navy,700,'middle')}${T(x+275,y+443,'Full last season',12,sub,700,'middle')}
  ${T(x+28,y+480,'2025–26 through Denver’s first 2 games',11,sub)}
  ${R(x+28,y+494,103,86,'#fff',14,line)}${T(x+40,y+518,'POINTS',10,sub,700)}${T(x+40,y+549,'24.0',21,navy,700)}${T(x+40,y+568,'vs 17.5 last',10,sub)}
  ${R(x+144,y+494,103,86,'#fff',14,line)}${T(x+156,y+518,'REBOUNDS',10,sub,700)}${T(x+156,y+549,'11.0',21,navy,700)}${T(x+156,y+568,'vs 13.5 last',10,sub)}
  ${R(x+260,y+494,103,86,'#fff',14,line)}${T(x+272,y+518,'ASSISTS',10,sub,700)}${T(x+272,y+549,'7.5',21,navy,700)}${T(x+272,y+568,'vs 12.5 last',10,sub)}
  ${section(x+28,y+617,'Game log','Most recent')}
  ${R(x+28,y+633,334,97,'#fff',14,line)}${R(x+29,y+634,332,27,'#f2f4f7',0)}${T(x+42,y+651,'MATCHUP',10,sub,700)}${T(x+261,y+651,'PTS',10,sub,700,'end')}${T(x+307,y+651,'REB',10,sub,700,'end')}${T(x+349,y+651,'AST',10,sub,700,'end')}
  ${T(x+42,y+683,'vs NOP · W',12,ink)}${T(x+261,y+683,'35',12,ink,700,'end')}${T(x+307,y+683,'15',12,ink,700,'end')}${T(x+349,y+683,'10',12,ink,700,'end')}
  ${L(x+29,y+694,x+361,y+694)}${T(x+42,y+715,'@ OKC · L',12,ink)}${T(x+261,y+715,'13',12,ink,700,'end')}${T(x+307,y+715,'7',12,ink,700,'end')}${T(x+349,y+715,'5',12,ink,700,'end')}`
function board(a,b){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="blur"><feGaussianBlur stdDeviation="12"/></filter><linearGradient id="veil"><stop stop-color="#0e2240" stop-opacity=".8"/><stop offset=".6" stop-color="#0e2240" stop-opacity=".25"/><stop offset="1" stop-color="#0e2240" stop-opacity=".65"/></linearGradient></defs>${R(0,0,W,H,'#080c13')}${phone(40,a[0],a[1],a[2])}${phone(470,b[0],b[1],b[2])}</svg>`
    .replace(/<rect([^>]*?)fill="#fff"/g, '<rect$1fill="#182231"')
    .replace(/<rect([^>]*?)fill="#e9edf3"/g, '<rect$1fill="#202c3c"')
    .replace(/<rect([^>]*?)fill="#f2f4f7"/g, '<rect$1fill="#27364a"')
    .replace(/<rect([^>]*?)fill="#e4ebf4"/g, '<rect$1fill="#2b3d56"')
    .replace(/<text([^>]*?)fill="#0e2240"([^>]*)>([^<]*)<\/text>/g, (whole, a, b, label) =>
      label === 'DN' || label === 'NJ' ? whole : `<text${a}fill="${ink}"${b}>${label}</text>`)
    .replace(/<text([^>]*?)fill="#2a4972"/g, '<text$1fill="#d3e3ff"')
}
await sharp(Buffer.from(board(['Games',gamesBody,300],['Game',detailBody,290]))).png().toFile(fileURLToPath(new URL('./games-preview.png', import.meta.url)))
await sharp(Buffer.from(board(['Players',playersBody,220],['Player',playerBody,210]))).png().toFile(fileURLToPath(new URL('./players-preview.png', import.meta.url)))
showLogos = true
await sharp(Buffer.from(board(['Games',gamesBody,300],['Game',detailBody,290]))).png().toFile(fileURLToPath(new URL('./games-logos-preview.png', import.meta.url)))
await sharp(Buffer.from(board(['Players',playersBody,220],['Player',playerBody,210]))).png().toFile(fileURLToPath(new URL('./players-logos-preview.png', import.meta.url)))
