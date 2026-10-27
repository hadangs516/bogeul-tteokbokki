const paths={
bowl:'<path d="M3 11h18c-1 7-4 10-9 10S4 18 3 11Z"/><path d="M8 3c-3 3 3 3 0 6m5-7c-3 3 3 3 0 6m5-5c-3 3 3 3 0 6"/>',
coin:'<circle cx="12" cy="12" r="9"/><path d="m7 9 2 7 3-7 3 7 2-7"/>',
star:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/>',
heart:'<path d="M20.8 4.6c-2-2.1-5.1-2.1-7.1 0L12 6.3l-1.7-1.7c-2-2.1-5.1-2.1-7.1 0s-2 5.2 0 7.3L12 21l8.8-9.1c2-2.1 2-5.2 0-7.3Z"/>',
book:'<path d="M12 5c-4-3-7-3-10-2v16c3-1 6-1 10 2 4-3 7-3 10-2V3c-3-1-6-1-10 2Zm0 0v16"/>',
shop:'<path d="M3 10v11h18V10M2 10l2-7h16l2 7M2 10c0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0 0 3 5 3 5 0M9 21v-7h6v7"/>',
users:'<circle cx="9" cy="7" r="4"/><path d="M1 21v-3c0-8 16-8 16 0v3M17 3a4 4 0 0 1 0 8m3 4c3 1 3 4 3 6"/>',
settings:'<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
sound:'<path d="m3 9 4 0 5-4v14l-5-4H3Zm13-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16"/>',
mute:'<path d="m3 9 4 0 5-4v14l-5-4H3Zm13 0 6 6m0-6-6 6"/>',
close:'<path d="m6 6 12 12M6 18 18 6"/>',
arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
check:'<path d="m5 12 4 4L19 6"/>',
fire:'<path d="M12 2c1 7 7 7 7 13a7 7 0 0 1-14 0c0-4 3-6 3-9 2 1 3 3 3 4 2-2 2-5 1-8Z"/>',
undo:'<path d="M3 9h11a7 7 0 1 1-6 11M3 9l5-5M3 9l5 5"/>',
lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 8v-4"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
pause:'<path d="M8 4v16M16 4v16"/>',
trophy:'<path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3c0 4 4 5 5 4m9-7h4v3c0 4-4 5-5 4m-4 3v6m-5 0h10"/>',
leaf:'<path d="M20 3c-9-2-17 3-15 12s17 4 15-12ZM4 21 15 10"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
plus:'<path d="M12 5v14M5 12h14"/>'
};
export const icon=(name,cls='')=>'<svg class="icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.bowl)+'</svg>';
export function food(id){
const wrap=s=>'<svg class="food-icon" viewBox="0 0 72 56" aria-hidden="true">'+s+'</svg>';
const rice='<g fill="#fff7dc" stroke="#c9ae7c" stroke-width="1.3"><rect x="13" y="12" width="13" height="33" rx="6" transform="rotate(28 20 28)"/><rect x="32" y="6" width="13" height="35" rx="6" transform="rotate(-12 38 23)"/><rect x="45" y="22" width="13" height="29" rx="6" transform="rotate(48 51 35)"/></g>';
const map={
rice,
fishcake:'<g fill="#dca955" stroke="#aa7539" stroke-width="1.2"><path d="m9 18 25-9 17 24-24 13Z"/><path d="m35 17 25 1 4 27-28-7Z"/></g><g fill="#a16c38"><circle cx="25" cy="24" r="1"/><circle cx="34" cy="31" r="1"/><circle cx="51" cy="28" r="1"/></g>',
scallion:'<g fill="#729b49" stroke="#487745" stroke-width="1.5"><ellipse cx="21" cy="20" rx="13" ry="7" transform="rotate(-35 21 20)"/><ellipse cx="46" cy="16" rx="13" ry="7" transform="rotate(30 46 16)"/><ellipse cx="40" cy="37" rx="15" ry="8" transform="rotate(-20 40 37)"/></g><g fill="#cad9a0"><ellipse cx="22" cy="19" rx="7" ry="3" transform="rotate(-35 22 19)"/><ellipse cx="46" cy="15" rx="7" ry="3"/><ellipse cx="40" cy="36" rx="8" ry="3"/></g>',
cheese:'<path d="m9 33 46-24 8 33-49 7Z" fill="#f6c94f" stroke="#c59932" stroke-width="1.4"/><path d="m9 33 47-17 7 26-49 7Z" fill="#ffe081"/><g fill="#e4ad38"><circle cx="28" cy="36" r="4"/><circle cx="47" cy="30" r="3"/><circle cx="52" cy="40" r="2"/></g>',
cream:'<path d="M24 7h22l6 9v32H20V16Z" fill="#fff5df" stroke="#b6ba9c" stroke-width="1.5"/><path d="M24 7v10h22l6-1-6-9Z" fill="#dfd9bc"/><path d="M20 23h32v16H20Z" fill="#76a897"/><path d="M36 25c-10 11-8 12 0 12s10-1 0-12" fill="#fff8e6"/>',
ramen:'<path d="M12 12h48v33H12Z" fill="#f5d692" stroke="#d5ad60" stroke-width="1.5"/><g fill="none" stroke="#bc934e" stroke-width="2">'+[19,26,33,40].map(y=>'<path d="M15 '+y+'q5-7 10 0t10 0t10 0t10 0"/>').join('')+'</g>',
sausage:'<g fill="#d88b75" stroke="#a85847" stroke-width="1.5"><rect x="13" y="7" width="17" height="41" rx="8" transform="rotate(25 22 27)"/><rect x="39" y="12" width="17" height="39" rx="8" transform="rotate(-30 47 31)"/></g><path d="m15 22 10 4m-13 4 10 4m22-11 9-5m-5 15 9-5" stroke="#a85847" stroke-width="2"/>',
cabbage:'<g fill="#99b66d" stroke="#668d4e" stroke-width="1.4"><path d="M35 45C0 46 5 17 22 15 15 1 43 4 46 15c24-8 29 24-11 30Z"/></g><path d="m35 45-5-28m5 21-17-9m16 2 16-8" fill="none" stroke="#e1e8af" stroke-width="4"/>',
glassnoodle:'<g fill="none" stroke="#bba68b" stroke-width="7" stroke-linecap="round"><path d="M16 12q40-4 30 11T20 42"/><path d="M13 28q40-4 43 13"/></g><g fill="none" stroke="#eee0c4" stroke-width="4" stroke-linecap="round"><path d="M16 11q40-4 30 11T20 41"/><path d="M13 27q40-4 43 13"/></g>',
mushroom:'<path d="m29 24-6 24h25l-7-24" fill="#f4dfb6" stroke="#aa8967" stroke-width="1.4"/><path d="M9 28C8 0 64 0 63 28c-15 9-36 9-54 0" fill="#a77d5e" stroke="#75543f" stroke-width="1.5"/><path d="M18 22c0-8 8-13 16-13" fill="none" stroke="#c49c78" stroke-width="3"/>'
};
return wrap(map[id]||rice);
}

