import type {ComponentType, ReactNode} from 'react';

export type ComicLanguage = 'en' | 'zh';
const ink = '#0B0C10';
const red = '#E63946';
const jade = '#00D4AA';
const gold = '#F4D35E';
const ivory = '#F6E9C9';

function Plate({children, align = 'xMidYMid'}: {children: ReactNode; align?: string}) {
  return <svg aria-hidden="true" focusable="false" className="gc-plate" width="100%" height="100%"
    viewBox="0 0 1000 540" preserveAspectRatio={`${align} slice`} xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>;
}

function Screen({id, color = ink, pitch = 6, size = 1.35}: {id: string; color?: string; pitch?: number; size?: number}) {
  return <pattern id={id} width={pitch} height={pitch} patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
    <circle cx={pitch / 2} cy={pitch / 2} r={size} fill={color}/>
  </pattern>;
}

// The cropped screen tones, dry-brush lines and silhouettes are drawn in this file so the
// comic works offline and scales to print sizes. No font is needed to draw the characters.
function Lantern({x, y, scale = 1, tilt = 0}: {x: number; y: number; scale?: number; tilt?: number}) {
  return <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`} strokeLinejoin="round">
    <path d="M0-48v28" stroke={ink} strokeWidth="4"/>
    <path d="M-16-24q16-5 32 0l-1 7h-30z" fill={gold} stroke={ink} strokeWidth="3.5"/>
    <path d="M-15-18c-22 5-25 31-14 44q7 9 22 11h16q17-3 23-15c7-16 0-35-17-40z" fill={red} stroke={ink} strokeWidth="4"/>
    <path d="M-15-16q-19 23-5 46m12-46q-10 30-4 49m12-48q-4 28 0 49m11-50q9 27 2 48m11-46q13 25 3 39" fill="none" stroke="#7B222D" strokeWidth="2.4"/>
    <path d="M-27 5q26-10 55-2M-28 18q27-7 55-1" fill="none" stroke="#FF8059" strokeWidth="2"/>
    <path d="M-13 34h25v6h-25z" fill={gold} stroke={ink} strokeWidth="3"/>
    <path d="M0 40v10m-6 10 2-13h8l3 17-4-2-2 4-3-5-4 3z" fill={red} stroke={ink} strokeWidth="2.7"/>
    <path d="M-28-2q1-10 11-14" fill="none" stroke="#FFB26D" strokeWidth="3.5" strokeLinecap="round"/>
  </g>;
}

function Gate({x, y, scale = 1}: {x: number; y: number; scale?: number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={ink} strokeLinejoin="round">
    <path d="M-73 18h11v61h-11zm135 0h11v61H62z" fill="#A33040" strokeWidth="3"/>
    <path d="M-67 20v55m132-55v55" stroke="#E8785E" strokeWidth="2"/>
    <path d="M-83 5q22 2 41-7l14-9h56l14 9q15 8 42 5l-7 12-11 5-129 1-13-5z" fill="#142E38" strokeWidth="3.5"/>
    <path d="M-82 5q22 4 42-7l12-8h55l18 11q17 7 39 2" fill="none" stroke="#71B3AB" strokeWidth="3"/>
    <path d="M-65 18H66v13H-65z" fill="#A23645" strokeWidth="2.5"/>
    <path d="M-38-9q16-1 25-11h24q8 8 27 10l-5 7h-66z" fill="#203C43" strokeWidth="3"/>
    <g stroke={gold} strokeWidth="2"><path d="M-58 22h22m72 0h21m-69-6h24v10h-24z" fill="#5A2B31"/><path d="M-6 20h3m3 0h4m3 0h1"/></g>
    <path d="m-55 11 5-4m8 4 7-6m9 6 5-5m9 5 5-5m9 5 4-5m8 5 3-5m9 5 2-5m10 5-1-5" fill="none" stroke="#40676A" strokeWidth="2"/>
  </g>;
}

function AlleyShadow({x, y, scale, flip = false}: {x: number; y: number; scale: number; flip?: boolean}) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
    <path d="m-17 40-11 11 18 1 12-21 11 20 16 1-9-10-4-20 3-15 8 5 6-6-11-16-9-4-2-8-8-6-10 4-2 9-12 5-13 20 2 5 9-4 9-10 3 14z" fill={ink}/>
    <path d="m-5-12 5-3 6 2m-18 11-7 8" fill="none" stroke="#595465" strokeWidth="2"/>
  </g>;
}

const distantBlocks = [
  [9,116,75],[61,96,40],[112,126,56],[160,78,42],[211,130,57],[277,107,70],[330,141,40],
  [373,114,48],[421,162,42],[467,149,47],[515,170,39],[554,136,40],[593,149,45],[642,113,54],
  [701,95,42],[749,115,65],[808,70,42],[849,87,65],[916,52,48],[967,96,45],
];

function Skyline({lit = '#638C91'}: {lit?: string}) {
  return <g>
    {distantBlocks.map(([x, top, w], i) => <g key={x}>
      <path d={`M${x} 365V${top + 7}h5v-7h${w - 10}v5h5v${360 - top}z`} fill={i % 3 === 0 ? '#182933' : '#233B45'}/>
      {Array.from({length: 5}, (_, n) => <path key={n}
        d={`M${x + 5 + ((i * 13 + n * 7) % (w - 12))} ${top + 14 + n * 15}h${i % 2 === 0 ? 4 : 6}`}
        stroke={lit} strokeWidth={3} opacity={n % 3 === 0 ? '.85' : '.42'}/>)}
    </g>)}
  </g>;
}

function RainStreet() {
  return <Plate>
    <defs>
      <linearGradient id="gc-night" x2=".72" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#172633"/><stop offset=".52" stopColor="#31535B"/><stop offset="1" stopColor="#715960"/></linearGradient>
      <linearGradient id="gc-wet" x2=".25" y2="1"><stop stopColor="#56616A"/><stop offset=".45" stopColor="#253741"/><stop offset="1" stopColor="#0E1A24"/></linearGradient>
      <Screen id="gc-street-tone" color="#0E202A" pitch={5.3} size={1.1}/>
      <pattern id="gc-rain" width="129" height="92" patternUnits="userSpaceOnUse">
        <path d="m10 7-9 24m54-26-12 37m38 21-7 22m43-53-5 16" stroke="#BDDFD8" strokeWidth="1.3" opacity=".38"/>
        <path d="m15 8-4 11m83-8L83 46m-47 24-5 15" stroke="#9FCCD0" strokeWidth=".8" opacity=".35"/>
      </pattern>
    </defs>
    <path fill="url(#gc-night)" d="M0 0h1000v540H0z"/>
    <path fill="url(#gc-street-tone)" d="M0 0h1000v198L574 98 0 211z"/>
    <Skyline lit="#E5B686"/>
    <path fill="#42606A" d="m293 207 70 13 9-11 35 16 31-6 41 12 22-8 47 7 44-11 13 7 38-11 50 6 57-18v90H293z"/>
    <path d="m261 206 148 48v103H250zm500-33-149 76v108h157z" fill="#2D424A" stroke={ink} strokeWidth="4"/>
    <path d="m274 218 118 40m-122-15 122 34m250-25 108-52m-115 65 116-48" stroke="#638E8D" strokeWidth="3" fill="none"/>
    <Gate x={528} y={264} scale={.91}/>
    <path d="M0 310 523 333 1000 297v243H0z" fill="url(#gc-wet)"/>
    <g fill="none" strokeLinecap="round">
      <path d="m0 414 508-77m-313 203 328-203m371 203L544 338m456 72-439-70M0 482l506-141m261 199L543 340" stroke={ink} opacity=".55" strokeWidth="2"/>
      <path d="m432 349 164 2m-209 11 254 2m-317 14 389 4m-479 21 534 3m-669 43 790 0m-888 47 984 0" stroke="#759393" opacity=".35" strokeWidth="1.8"/>
    </g>
    <g fill="#BC4448" opacity=".85">
      <path d="m255 363 67-1-26 4 14 1-33 4 13 2-41 3-5 3 32 1-54 8-48 1 18-5 40-3-19-3 26-3-9-3 27-5-15-2z"/>
      <path d="m192 399 78-4-14 4 13 1-45 6 18 2-88 9-21-1 34-5-13-1 47-6-23-1zm-83 41 94-6-27 6 17 1-59 8-55 2z"/>
      <path d="m712 353 18 1-7 2 19 1-5 2 30 4-11 2-45-3 10-3-14-2zm84 31 74 3-9 2 33 6-62-5-4 3-34-6zm60 35 99 6-21 3 28 3-46-1z"/>
    </g>
    <g fill={jade} opacity=".67">
      <path d="m351 365 20-3h18l-13 3 7 1-43 6 23-5zm-36 20 39-6-8 3 15-1-31 6 5 1-42 5z"/>
      <path d="m596 353 23 1 6 3 24 1-4 2-32-2-9-2-17-1zm38 20 30 1-6 2 33 4-41-2-21-4zm67 38 47 1 27 5-38-2 6 3-75-6z"/>
      <path d="m450 455 75-4-1 3 64-1-44 4-90 3zm-18 12 86-3-39 4-70 2z"/>
    </g>
    <g stroke={ink} strokeLinejoin="round">
      <path d="M0 0h62l91 41 117 72 66 46v183L0 419z" fill="#253840" strokeWidth="5"/>
      <path d="m0 0 101 21 188 113-13 14L0 51z" fill="#151D28" strokeWidth="5"/>
      <path d="m0 16 91 26 187 98" stroke="#608A86" fill="none" strokeWidth="4"/>
      <path d="m0 62 110 37 162 66-4 13L0 126z" fill="#833643" strokeWidth="4"/>
      <path d="m0 73 255 89m-255-72 254 81" stroke="#D76356" fill="none" strokeWidth="2.4"/>
      <path d="m0 132 262 54v37L0 201z" fill="#426669" strokeWidth="4"/>
      <path d="m0 140 55 12v33l-55-6zm71 16 45 10v27l-45-7zm58 12 42 9v24l-42-6zm53 12 32 7v19l-32-4zm45 9 25 5v15l-25-3z" fill="#C38864" strokeWidth="4"/>
      <path d="m10 139 1 40m18-35v39m48-28v34m19-29v33m48-19v25m14-24v25m39-14v18m40-12v16" fill="none" strokeWidth="3.5"/>
      <path d="M0 199 269 225l56-2-12 23-49 6L0 241z" fill="#1A222C" strokeWidth="5"/>
      <path d="m0 232 266 13 43-6" stroke="#A25855" strokeWidth="4" fill="none"/>
      <path d="m13 241 169 1 2 113-172 45z" fill="#1B252B" strokeWidth="4"/>
      <path d="m22 249 90 1v72l-89 15z" fill="#DB8260" strokeWidth="5"/>
      <path d="m31 255 31 1v65l-31 5zm41 0h29v59l-29 4z" fill="#76454B" strokeWidth="4"/>
      <path d="m125 248 43 1v90l-42 10z" fill="#31524F" strokeWidth="4"/>
      <path d="m196 249 50 0v72l-49 12z" fill="#A65A50" strokeWidth="4"/>
      <path d="m204 255 36-1m-36 12 36-2m-36 13 36-3m-36 14 36-4m-36 14 36-5" fill="none" strokeWidth="3"/>
      <path d="m264 247 37-5v70l-37 10z" fill="#334951" strokeWidth="3.5"/>
      <path d="m0 399 332-66-5 14L0 429z" fill="#486164" strokeWidth="4"/>
    </g>
    <g stroke={ink} strokeLinejoin="round">
      <path d="M1000 0H895L784 67l-78 77-36 62v114l330 64z" fill="#263740" strokeWidth="5"/>
      <path d="m1000 14-89 23-155 89-45 42 48-22-9 16L1000 69z" fill="#111C27" strokeWidth="5"/>
      <path d="m1000 26-90 25-131 74-57 34" fill="none" stroke="#6E9A93" strokeWidth="4"/>
      <path d="m1000 77-202 79-39 40 241-70z" fill="#6D3442" strokeWidth="4"/>
      <path d="m1000 89-198 76m194-54-204 64" fill="none" stroke="#C45B53" strokeWidth="3"/>
      <path d="m1000 134-223 65-6 35 229-43z" fill="#60817E" strokeWidth="4"/>
      <path d="m980 150-45 12v25l45-9zm-61 17-43 12v21l43-8zm-56 15-38 11v17l38-7zm-49 14-26 7v16l26-5z" fill="#DFAB77" strokeWidth="3.8"/>
      <path d="m957 154 1 31m-59-13v26m-55-9v20m-43-10v17" fill="none" strokeWidth="3.4"/>
      <path d="m1000 198-233 43-46-5 19 21 260-20z" fill="#151F28" strokeWidth="5"/>
      <path d="m1000 222-248 25-24-5" stroke="#697E78" fill="none" strokeWidth="3"/>
      <path d="m1000 243-99 7 1 88 98 23zm-115 8-67 5 1 67 66 13zm-78 6-46 4v53l46 8z" fill="#513740" strokeWidth="4"/>
      <path d="m994 253-84 5 1 40 83 6zm-118 7-48 4v41l48 4zm-76 5-30 3v26l30 2z" fill="#AB6860" strokeWidth="3.5"/>
      <path d="m950 250 1 58m-101-47v44m-65-40v31" fill="none" strokeWidth="4"/>
      <path d="m674 323 326 39v19l-328-51z" fill="#40535B" strokeWidth="4"/>
    </g>
    <g transform="translate(287 168) skewY(8)" strokeLinejoin="round">
      <path d="m-9-10-23-8m34 6 24-7" stroke={ink} strokeWidth="5"/>
      <path d="M-17-13h35v104h-35z" fill="#A42F40" stroke={ink} strokeWidth="5"/>
      <path d="M-12-8h25v94h-25z" fill="none" stroke="#EF8567" strokeWidth="1.6"/>
      <g fill="none" stroke="#F6CD79" strokeWidth="2.3" strokeLinecap="square">
        <path d="m-1 1 2 3m-10 2H9v5m-17-5v5m5 0 10 0-4 5-9 5m2-8 15 8m-13 2h11v8H-4z"/>
        <path d="M-8 43h7m-4-6v28m-4-12 4-9 4 7m0-8 12-3m-12 10 13-3m-9-11q0 19 9 26m-3-24 3 2m-1 12-9 10"/>
      </g>
    </g>
    <g transform="translate(741 183) skewY(-14)" fill="none" strokeLinejoin="round">
      <path d="m3-7 34-1m-34 12 34-2" stroke={ink} strokeWidth="4"/>
      <path d="M-17-10h31v71h-31z" fill="#152831" stroke={ink} strokeWidth="4.5"/>
      <path d="M-12-5H9v60h-21z" stroke="#227A76" strokeWidth="2"/>
      <path d="M-9 7H6m-11-3v7m8-7v7m-4 1-8 8m8-8 8 8M-7 23H5m-6-6v16m-3-7-5 5m12-5 5 4" stroke="#174A4E" strokeWidth="5.4"/>
      <path d="M-9 7H6m-11-3v7m8-7v7m-4 1-8 8m8-8 8 8M-7 23H5m-6-6v16m-3-7-5 5m12-5 5 4" stroke="#76E6C3" strokeWidth="1.7"/>
      <path d="M-9 42H7m-16 4H3m-12 4H6" stroke="#4B9C90" strokeWidth="1.3"/>
    </g>
    <path d="m0 307 20-9 16-29 15-15-7 25 13-16-12 29-22 18-12 37L0 356zm132 33 24-37-17 48-17 4zm867-190-22 30 6-20-14 11 13-31z" fill={ink}/>
    <g fill="none" stroke={ink} strokeWidth="3.5">
      <path d="M-22 4q290 155 600 135T1021 36"/><path d="M-6 107q325 113 564 93t457-88"/>
      <path d="M267 224q200 66 417 3" strokeWidth="2"/>
    </g>
    <Lantern x={164} y={94} scale={1.21} tilt={-6}/><Lantern x={353} y={146} scale={.65} tilt={-4}/>
    <Lantern x={561} y={153} scale={.52} tilt={3}/><Lantern x={761} y={130} scale={.71} tilt={4}/>
    <Lantern x={899} y={95} scale={1.03} tilt={7}/>
    <Lantern x={389} y={213} scale={.36}/><Lantern x={638} y={209} scale={.42}/><Lantern x={738} y={196} scale={.49}/>
    <Lantern x={454} y={262} scale={.24}/><Lantern x={595} y={263} scale={.22}/>
    <g fill="#153138" opacity=".8"><ellipse cx="531" cy="361" rx="33" ry="4"/><ellipse cx="579" cy="367" rx="25" ry="4"/><ellipse cx="647" cy="389" rx="47" ry="6"/></g>
    <AlleyShadow x={536} y={338} scale={.48}/><AlleyShadow x={580} y={342} scale={.5} flip/>
    <AlleyShadow x={652} y={349} scale={.76} flip/>
    <path d="m652 340 3-2 3 2-3 2z" fill="#DD829D"/>
    <g fill="none" stroke="#92B3AD" opacity=".58" strokeWidth="1.5">
      <path d="M518 398q17-3 31 0m-26 3q8 1 17-1m154 54q20-4 43-1m-37 4q14 2 24-1m-365-33q6-2 19 0m-119 64q36-6 80-2"/>
    </g>
    <path fill="url(#gc-rain)" d="M0 0h1000v540H0z"/>
    <path d="M0 0h66L49 91l-6 89-17 9-11 126L0 344zm1000 0h-31l-9 121 17 4 6 195 17 18z" fill={ink}/>
  </Plate>;
}

function LanternCrash() {
  return <Plate>
    <defs>
      <linearGradient id="gc-crash-wash" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#291C32"/><stop offset=".55" stopColor="#75343D"/><stop offset="1" stopColor="#231C2B"/></linearGradient>
      <Screen id="gc-crash-tone" pitch={6.2} size={1.85}/>
      <Screen id="gc-villain-tone" pitch={5} size={1.1} color="#392B48"/>
    </defs>
    <path d="M0 0h1000v540H0z" fill="url(#gc-crash-wash)"/>
    <path d="M0 0h1000v134L366 235 0 125zM0 540l361-233 639 164v69z" fill="url(#gc-crash-tone)" opacity=".73"/>
    <g transform="rotate(-9 500 270)">
      <path d="M-100 86 1150 12v63L-80 157zm37 123 1123-91v20L-78 244z" fill="#25323C" stroke={ink} strokeWidth="6"/>
      <path d="m-40 114 1050-76m-1027 102 941-74" fill="none" stroke="#945452" strokeWidth="4"/>
      <path d="M56 155h74v69H56zm86-7h74v69h-74zm86-7h71v67h-71zm81-7h73v65h-73z" fill="#9D605A" stroke={ink} strokeWidth="5"/>
      <path d="m78 153 1 68m87-72v67m84-71v65m83-77v66" stroke={ink} strokeWidth="5"/>
      <path d="M-55 297 322 235l5 22-337 92z" fill="#D56A59" stroke={ink} strokeWidth="4"/>
    </g>
    <path d="m-40 281 383-51L21 179l297 36L44 63l294 135L175 0l185 172L291 0l91 153L419 0l-13 165L580 0 436 182 751 13 458 205l542-114-541 144 541-23-558 48 558 117-573-93 376 200-403-171 175 227-199-214 20 214-58-217L198 540l113-210L21 540l272-233L0 423l277-134z" fill="#BF4A48" opacity=".78"/>
    <g fill={ink} opacity=".9">
      <path d="m0 39 289 150L52 81zm0 44 247 104L0 104zm135-83 167 145L163 2zM0 479l253-154L16 489zm68 61 238-202-180 180zm747-540L503 147 864 0zm185 43L554 174 1000 68zm0 319L647 310l353 74zm0 131L720 376l258 124z"/>
    </g>
    <path d="m85 0 62 64 46 22 52 45 50 12" fill="none" stroke={ink} strokeWidth="6"/>
    <path d="M221 108q59 44 90 89" fill="none" stroke="#CF9B75" strokeWidth="2"/>
    <AlleyShadow x={953} y={313} scale={1.65} flip/>
    <AlleyShadow x={200} y={356} scale={.88}/>
    <g stroke={ink} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round">
      {/* Jacket flaps and the brass-buttoned vest wrap around a belly in a low, twisting stance. */}
      <path d="M645 268q57-35 122 8l75 49 58 104 16 89-70 32H468l15-69 50-101 48-77z" fill="#774B78"/>
      <path d="m589 306-45 65-69 102 60-37 15 18 48-46 22-72zm157-38q42 41 44 92l42 39 34 84 37 9-9-74-44-92-63-52z" fill="#502F55"/>
      <path d="M631 283q-14 34-20 67-19 64-52 106l71 28 111-26-6-64-15-81-22-26z" fill="#D5A3B1"/>
      <path d="M633 316q30 34 76 24m-96 28q49 13 81 1m-96 54q22-12 50-11" stroke="#966D8A" strokeWidth="6" fill="none"/>
      <path d="m575 435 92 19 74-20 15 22-87 28-103-22z" fill="#342735"/>
      <path d="m641 453 39 1 3 23-43 2z" fill={gold} strokeWidth="4.5"/>
      <path d="m649 460 23 1v8l-22 1z" fill={ink} strokeWidth="2"/>
      <path d="m567 466 94 20 92-25 36 44 42 44H487l21-55z" fill="#44374F"/>
      <path d="m659 490 31 24 27 26m-127-58-29 33m200-37 29 28" fill="none" stroke="#76536F" strokeWidth="5"/>
      <path d="m609 278 30 8-10 47-45 68-35 37-42-24 53-82z" fill="#7D3778"/>
      <path d="m607 284-22 35-20 44-42 51 15 8 39-39 34-62 13-28z" fill="#A64C8B" strokeWidth="3"/>
      <path d="m716 283 38-6 36 45 18 82-21 46-42 14-9-88-17-53z" fill="#87407D"/>
      <path d="m759 284 21 44 7 92-27 23 35-9 14-35-18-78z" fill="#533454" strokeWidth="3"/>
      <g fill={gold} strokeWidth="3.5"><ellipse cx="601" cy="324" rx="7" ry="8" transform="rotate(24 601 324)"/><ellipse cx="577" cy="367" rx="7" ry="8" transform="rotate(25 577 367)"/><circle cx="756" cy="328" r="7.5"/><circle cx="768" cy="369" r="7.5"/><circle cx="771" cy="409" r="7.5"/></g>
      <path d="M774 300q19-23 50-15l45 19 24-18 21 16-15 48-47 13-63-27z" fill="#A5749F"/>
      <path d="m809 318 34 23 35-6-21 17-55-21z" fill="#745274" strokeWidth="3"/>
      <path d="M869 305q-5-9 0-15l13-19 14 1 6-9 13 3 10-2 15 12 1 17-8 14-22 10-26 5z" fill="#B387B0"/>
      <path d="m888 285 9 7m1-19 10 8m3-10 9 8m-7 20 13-10" fill="none" strokeWidth="3"/>
    </g>
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      <path d="M573 204q-20-43 5-80 21-36 68-44 48-11 88 7 38 17 50 54l2 21q22-15 34 0 12 20-3 37l-24 13q-3 38-30 58-27 24-70 27l-56-8-38-25-19-28q-13 2-19-9-6-10 12-23z" fill="#AD85AE" strokeWidth="7"/>
      <path d="M587 145q15-43 60-55 25-6 43-1l-27 6q-38 10-55 42l-12 11z" fill="#E5B9D0" stroke="none"/>
      <path d="M744 100q42 23 41 73l18-11 12 8-4 18-20 10-10 33-28 30-29 12-46 3 17 10 42-6 32-19 23-26 6-24 21-11 9-15q5-38-21-34l-15 1-9-26z" fill="#75516F" stroke="none"/>
      <path d="m792 179 12-5 5 4-7 8m-211 48 10 4m154-3 16-10" strokeWidth="3.5" fill="none"/>
      <path d="m576 180 41 10-3 17q-16 11-33-4z" fill={ivory} strokeWidth="4.5"/>
      <path d="m648 181 61-16-8 24q-17 14-44 9z" fill={ivory} strokeWidth="4.5"/>
      <path d="M591 190q8-4 11 3t-4 12q-7-1-7-15zm66-5q9-9 14-2 4 9-7 14-6-1-7-12z" fill={ink} stroke="none"/>
      <path d="m567 162 14-7 36 17 9 21-23-9-24-8zm77 23 8-20 45-18 23 2-5 10-29 5z" fill="#322337" strokeWidth="5"/>
      <path d="m623 191-10 19 11 7 9-5" fill="#896384" strokeWidth="4"/>
      <path d="M603 230q31 4 50-6 25-11 55-19l8 14-6 21q-48 28-90 12z" fill="#332432" strokeWidth="5"/>
      <path d="m610 232 22-1 25-8 46-13 4 9-10 11-32 7-38 2-12-2zm28 11 35-5 24-7-9 9-30 8-17 1z" fill={ivory} strokeWidth="2"/>
      <path d="m635 230 1 8m21-14 2 12m18-18 3 13m12-17 3 11" strokeWidth="2.4"/>
      <path d="M622 136q16-25 40-17 11 3 18 12-10 23-31 21-17 0-27-16z" fill={gold} strokeWidth="5"/>
      <ellipse cx="651" cy="135" rx="12" ry="13" transform="rotate(-14 651 135)" fill="#FF6399" strokeWidth="2.5"/>
      <path d="m651 125 3 10-4 10-3-10z" fill={ink} stroke="none"/><circle cx="655" cy="130" r="3.1" fill="white" stroke="none"/>
      <path d="m608 257 25 12 46-2-30 9-28-3zm119-92 29-15-6 18-21 14zm-25 86 34-17 24-23-10 26-27 20z" fill="url(#gc-villain-tone)" stroke="none"/>
      <path d="m624 114-7 6m31-14 6-6m18 17 10 2" stroke="#E38FA8" strokeWidth="3.5"/>
    </g>
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      <path d="M616 283q-19-21-43-21l-67 3-77-18-15-15-26-10-28 5-26 12-10 16 7 17 18 13 42 7 26-5 59 21 74 26 45-6 22-19z" fill="#AE86AC" strokeWidth="7"/>
      <path d="m600 283-39 15-61-10-42-12-38-8-8 13 71 26 64 22 39-2 26-18z" fill="#795775" stroke="none"/>
      <path d="m344 241 23-9 22-4 19 8-8 5-30-2-17 7zm75 10 27 6-9 5-23-5z" fill="#E7BCD1" stroke="none"/>
      <path d="m358 246 14 4 8 14m-40-10 16 4 8 13m11-32 16 3 7 13m-51 16 15 8m31-15 15-8 12 0m48 22 27 4m28 0 40-1" fill="none" strokeWidth="3.6"/>
      <path d="m477 300 77 22 31-6-2 9-38 4-65-23z" fill="url(#gc-villain-tone)" stroke="none"/>
    </g>
    <g className="gc-shards" stroke={ink} strokeLinejoin="round">
      <path d="m296 236-46-43 57 30-11-55 25 47 16-61 2 62 25-35-9 41 48-7-41 21 23 8-26 4 38 30-48-14 11 36-26-29-9 56-9-50-29 36 12-43-68 32 49-43-65-4 70-9z" fill={gold} strokeWidth="4"/>
      <path d="m312 235-13-28 26 16 12-33 1 40 30-14-16 24 23 14-34-4-9 29-8-24-36 8 24-19-23-9z" fill="#FFF0B8" stroke="none"/>
      <g fill={red} strokeWidth="4">
        <path d="m235 152 22-12 37 6-13 23-9-2-6 17-33 7-13-18z"/>
        <path d="m260 206 22-13 14 1-6 7 8 4-17 24-15-2-22 17 5-20z"/>
        <path d="m254 245 19-6-6 15 11 2-28 20-32 6 8-15z"/>
        <path d="m280 283 23-15-2 13 15-4-6 26-18 21-17 2-15-17z"/>
        <path d="m326 299 9-19 8 12 12-3-5 20-17 13z"/>
        <path d="m218 206 13-17 3 13-6 13zm55-78 9-10 9 10-8 13zm-82 147 9-9 10 4-13 9zm119 61 7-8 4 12-10 8z"/>
      </g>
      <path d="m231 143 17-10 23 1-5 7-24 8zM270 330l18 1 11-8 5 7-17 12-21-1z" fill={gold} strokeWidth="3"/>
      <path d="m283 340-9 14m0-3 5 8-13 23-1-9-7 6 2-8-8 1 16-22z" fill={red} strokeWidth="3"/>
      <path d="m234 161 32-12m-33 26 27-12m12 45 15-11m-51 68 21-16m19 48 20-16m-15 28 11-9" fill="none" stroke="#FF986B" strokeWidth="3"/>
      <g fill="#FFE3A1" strokeWidth="1.7"><path d="m207 227-15-6 18 2zm26-33-7-17 12 17zm38 134-10 23 5-23zm78-155 11-20-5 22zm-11 161 10 15-13-11z"/></g>
    </g>
    <g stroke={ivory} strokeWidth="2.4" opacity=".64" strokeLinecap="round"><path d="m34 287 148-30m-100 44 114-36m557-179 140-48m-62 47 82-27m-55 310 102 19"/></g>
    <path d="m0 500 159-82-85 64 52-15-108 73H0zm1000-38-96-45 46 41-28-5 78 67z" fill={ink}/>
  </Plate>;
}

function RoofWatch() {
  return <Plate>
    <defs>
      <linearGradient id="gc-roof-night" x1="0" x2="1" y1="1" y2="0"><stop stopColor="#10232F"/><stop offset=".57" stopColor="#28545B"/><stop offset="1" stopColor="#132633"/></linearGradient>
      <Screen id="gc-moon-dots" color="#3B817B" pitch={5} size={1.05}/>
      <Screen id="gc-roof-dots" pitch={5.8} size={1.35}/>
      <clipPath id="gc-moon-clip"><circle cx="594" cy="203" r="160"/></clipPath>
    </defs>
    <path d="M0 0h1000v540H0z" fill="url(#gc-roof-night)"/>
    <path d="M0 0h1000v104L808 50 390 68 0 181z" fill="url(#gc-roof-dots)" opacity=".5"/>
    <circle cx="594" cy="203" r="166" fill="#58A29C" opacity=".65"/>
    <circle cx="594" cy="203" r="160" fill="#A4D3BB" stroke={ink} strokeWidth="4"/>
    <g clipPath="url(#gc-moon-clip)">
      <path d="M427 94q130-95 287-33l-76 7-121 20-35 16 99-12-143 33zm-10 119 127-30-37 15 72-6-164 49zm-1 75q144-56 344-44v137H418z" fill="url(#gc-moon-dots)"/>
      <path d="m415 153 64-14 66-7-38 6 125-6-118 12-42 10zm264-50 68-7-6 6-45 3zm-207 97 79-11-25 7-50 7z" fill="#66A79A" opacity=".7"/>
    </g>
    <g fill="#345F64">
      <path d="m0 185 68-12 102-5 87-14-64 19 121-5-168 21-45 11-101 9zm99-88 70-13 89-3-43 7 106-4-153 15zm644 47 67-12 127-4 63-12v21l-93 7 33-8-94 7zm-124 88 94-10 93-4-50 8-87 6z"/>
    </g>
    <g transform="translate(0 205) scale(1 .75)" opacity=".68"><Skyline lit="#A8A480"/></g>
    <path d="M0 424v-75l72-9 9-17 36 5 8 15 40-3v68l21-3v-83l69-15 12 9v51l56-12v-58l50 6v60l32-2v-45l36-8 25 5v59l43-4 9-30 48 7 7 25 55-10v-62l65 6 14 15 34-4v-44l61-23 20 7v51l34-4v-66l44-20 43-2v46l64-10v120z" fill="#1A343E"/>
    <g fill="#826B62"><path d="m31 366 19-3v7l-19 3zm193-38 10-2v10l-10 2zm10 16 9-2v9l-9 2zm102-30 17 1v7l-17-1zm504-25 14-4v7l-14 4zm95-16 16-2v8l-16 2z"/></g>
    <path d="m-23 438 176-35 34-8 36-23 19 2 16 17 55-4 20 10-17 8-23 4v35l-316 68z" fill="#12232C" stroke={ink} strokeWidth="5"/>
    <path d="m-8 435 173-35 34-12m20-17 24 2 17 16 41-3" fill="none" stroke="#72918B" strokeWidth="3.2"/>
    <Gate x={828} y={357} scale={.55}/>
    <g fill="none" strokeLinecap="round">
      <path d="m0 469 299-54m523-110 178-44m-168 47 126-30" stroke={ink} strokeWidth="2.7"/>
      <path d="m67 241 38-3m50-30 84-11m22 1 37-5m485-12 102-12m-78 17 55-6m16-4 48-7" stroke="#78A79A" strokeWidth="1.7"/>
    </g>
    <g stroke={ink} strokeLinecap="round" strokeLinejoin="round">
      {/* Tied-up hair and the sash move with the wind while her feet stay planted. */}
      <path d="M589 128q7-28 29-42 27-17 57-13 32 3 57-9 21-11 29-28-4 26-27 43l24-7q-27 26-64 29l-26 8q21 0 36-3-21 16-51 18-25 2-42 17z" fill="#211C29" strokeWidth="5.5"/>
      <path d="M606 122q22-34 56-37 42 4 70-13-20 19-64 24-25 5-42 22l36-11-23 14z" fill="#645365" stroke="none"/>
      <path d="M589 124q3-15 14-24l11 7q-12 10-15 23z" fill={red} strokeWidth="3"/>
      <path d="M637 272q34-13 67 0 42 15 75 1 21-11 34-27-4 15-16 27 28-8 51-31-13 33-47 49-37 18-85 4l-53-7-28 5z" fill="#BC3B4B" strokeWidth="5"/>
      <path d="M650 280q36-5 71 8 36 12 73-1" fill="none" stroke="#FF7868" strokeWidth="3"/>
      <path d="M625 286q47 3 69 23 28 26 56 25l22-5-21 15 29 5c-44 7-71-7-97-28-16-13-36-17-61-17z" fill="#923444" strokeWidth="4"/>
      <path d="m595 284 47 16 39 20 36 42 5 15-16 9-17-8-34-33-49-5-30-25z" fill="#2C2938" strokeWidth="6"/>
      <path d="m634 316 33 12 31 37-13-3-21-23-28-10z" fill="#5C495A" stroke="none"/>
      <path d="m695 366 14-10 9 8 3 8 16 2 9 6-1 7-21 4-24-5-8-8z" fill="#1B2028" strokeWidth="4.5"/>
      <path d="m700 368 10-7 7 8-11 7z" fill="#DAC590" strokeWidth="2.5"/>
      <path d="M591 281q-18 17-28 40l-6 32-26 45 15 15 20-5 35-48q11-17 20-46l-3-20z" fill="#393344" strokeWidth="6"/>
      <path d="m599 309-12 22-13 31-26 35 9 0 37-50 13-30z" fill="#5D4F60" stroke="none"/>
      <path d="m533 394 19 9-5 15-7 9-18 5-22 3-13-4 7-9 24-9z" fill="#21232D" strokeWidth="5"/>
      <path d="m533 393 21 9-3 8-20-8z" fill="#E7D4A0" strokeWidth="2.4"/>
      <path d="m494 428 21-1 24-7" stroke="#D2B893" strokeWidth="2.5" fill="none"/>
      <path d="m575 172 20-2 11 18 27 11 17 33-11 35 27 50-26-3 15 18-32-4-20-25-13 22-76 20 22-33 9-37-11-22 14-49 12-18z" fill="#11666B" strokeWidth="6"/>
      <path d="m601 185 22 13 11 28-22 31-11 22 10 25 30 16-13-30-4-28 18-30-15-35z" fill="#10343D" stroke="none"/>
      <path d="m554 234-5 32 15 11-12 31-21 25 43-12 17-27 4-16-18-12-7-28z" fill="#123543" stroke="none"/>
      <path d="m568 192-16 24-8 29 7 6 10-25 19-25z" fill="#49B4A6" stroke="none"/>
      <path d="m573 181 9 10-21 45-6 18-6-5 11-44z" fill={ivory} strokeWidth="3"/>
      <path d="m593 180 9 9-16 28-25 34-9 3 6-13 20-33z" fill="#C5B48B" strokeWidth="3.4"/>
      <path d="m552 262 16-6 47 3 23-8 5 14-29 11-48-3-16 5z" fill={red} strokeWidth="4"/>
      <path d="m624 259 14-4 8 9-3 13-13 3-11-7z" fill="#EC5360" strokeWidth="3"/>
      <path d="m523 338 39-10 22-6m35 2 29 4" stroke={gold} strokeWidth="3" fill="none"/>
      <path d="m544 330 10-8q8-8 14-3l-8 5h9l8-7m52 1-5-6" fill="none" stroke="#D1B86F" strokeWidth="2"/>
      <path d="m627 204 20 11 22 20 26 9-5 15-30-1-27-19-15-9z" fill="#16565D" strokeWidth="5"/>
      <path d="m635 219 24 23 26 7-9 5-22-6-23-15z" fill="#10323D" stroke="none"/>
      <path d="m687 243 15 3 12 10-5 9-15-4-9-8z" fill="#A9796B" strokeWidth="4"/>
      <path d="m683 241 10 1-4 16-9-2z" fill="#CE4550" strokeWidth="3"/>
      <path d="m565 205-20-2-19 13-20 27-20 6 7 17 33-4 25-22 16-17z" fill="#18747A" strokeWidth="5.5"/>
      <path d="m548 211-15 5-21 32-16 8 16-2 18-12 15-20z" fill="#4EB5A5" stroke="none"/>
      <path d="m486 247-8 4 5 18 11-3z" fill="#E3CA92" strokeWidth="3"/>
      <path d="m479 251-17 6-15-1-13 6 5 9 20 1 27-7z" fill="#C18D73" strokeWidth="3.5"/>
      <path d="m467 252 11-2 5 16-12 3z" fill="#C6424C" strokeWidth="3"/>
      <path d="m471 252 4 14m1-15 4 13" stroke="#6B343D" strokeWidth="2"/>
      <path d="m579 162 19-7-2 20 8 9-14 12-17-14z" fill="#A66F64" strokeWidth="4"/>
      <path d="M540 149q-4-15 10-26 15-13 34-8l20 12 1 20-12 16-11 16-12 7-13-8-1-10-12-1 1-9-9-3z" fill="#C49378" strokeWidth="4.7"/>
      <path d="m546 145-2 10 10 3-3 7 9-1 5 8 6-1 4-10 10-10-14-14z" fill="#E2B590" stroke="none"/>
      <path d="m561 178 11 3 14-18 7-3-7 13-13 10z" fill="#654554" stroke="none"/>
      <path d="M536 151q-4-24 12-38 23-21 44-11l14 14 3 23-9 17-13 8 1-17-13-20q-15 19-39 24z" fill="#25212A" strokeWidth="5"/>
      <path d="M539 144q17-12 27-27 13-7 29-5-10-10-22-7-23 3-34 39z" fill="#4D4453" stroke="none"/>
      <path d="M568 130q-5 16-20 23m29-23 9 27" fill="none" stroke={ink} strokeWidth="3.1"/>
      <path d="m546 153 14-5-7 8zm11 18 8-2-5 4z" fill={ink} stroke="none"/>
      <path d="m551 155 4-3" stroke="#F4DDB1" strokeWidth="1.5"/>
      <path d="m446 257-25-6-2 8 25 7z" fill="#71353C" strokeWidth="3"/>
      <path d="m420 248 4 1-2 16-5-1z" fill={gold} strokeWidth="2.5"/>
      <path d="M420 255 275 228q30 15 76 23l67 10z" fill="#C9E1C7" strokeWidth="3.1"/>
      <path d="m280 229 137 28" stroke={jade} strokeWidth="2.5"/>
    </g>
    <g className="gc-glint" fill="#BAFFE9">
      <path d="m343 239 22-1 14-20-8 21 28 4-29 2-13 19 7-20z"/><path d="m382 221 3-6 1 5 6 1-6 2-3 6v-6l-6-1z"/>
    </g>
    <path d="m225 315 243-62-102 34 22-1z" fill={jade} opacity=".94"/>
    <g stroke={ink} strokeLinejoin="round">
      <path d="M62 557 536 423l172-48 69 19 53 4 79 25 91 13v104z" fill="#1D3942" strokeWidth="7"/>
      <path d="m101 540 429-123 177-51 68 18 53 5q35 10 65 10-12 13-31 14l-51-8-43-2-60-18-171 47-349 108z" fill="#395C5B" strokeWidth="4.5"/>
      <path d="m119 539 446-129 142-39 63 18 44 3 51 9" fill="none" stroke="#7C9F90" strokeWidth="3"/>
      <path d="m169 540 534-141 297 53v88z" fill="url(#gc-roof-dots)" stroke="none"/>
      <path d="m247 540 399-117m-321 117 333-113m-256 113 265-109m-193 109 202-107m-126 107 134-106m-69 106 80-104m-9 104 23-102m54 102-58-103m131 103-121-101m209 101-199-99m287 99-276-96" fill="none" strokeWidth="5"/>
      <path d="m273 512 410-103 195 37m-514 46 223-51m80 24 180 43" fill="none" stroke="#4D7270" strokeWidth="2"/>
      <path d="m878 540 122-45v45z" fill={ink} stroke="none"/>
    </g>
  </Plate>;
}

function StreetLeap() {
  return <Plate align="xMaxYMid">
    <defs>
      <linearGradient id="gc-splash-sky" x1=".1" y1="1" x2=".85" y2="0"><stop stopColor="#362936"/><stop offset=".52" stopColor="#A03947"/><stop offset="1" stopColor="#E55C53"/></linearGradient>
      <Screen id="gc-splash-tone" pitch={6.4} size={2.05}/>
      <Screen id="gc-coat-tone" color="#143E4B" pitch={4.3} size={1}/>
    </defs>
    <path d="M0 0h1000v540H0z" fill="url(#gc-splash-sky)"/>
    <path d="M0 0h1000v73L742 42 547 78 282 224 0 383z" fill="url(#gc-splash-tone)" opacity=".68"/>
    <path d="m821 0-67 74 34-74zm102 0L798 98 973 0zm77 54L811 153l189-72zm0 74L839 183l161-31zm0 177-145-38 145 67zm-1 133L839 323l130 129zm-70 102L805 367l86 173zm-139 0-41-162 7 162zm-233 0 93-151-127 151zm-139 0 190-188-249 188zM370 0l234 119L298 0z" fill="#F48167"/>
    <g fill={ink}>
      <path d="m541 0 59 67-84-65zm365 0-83 77L931 0zm94 18L831 125l169-88zm0 77-115 55 115-42zm0 142-94 8 94 0zm0 155-101-62 101 48zM447 540l157-183-188 183zm361 0-34-93 19 93z"/>
      <path d="m970 0-79 73 33-18 63-55zm30 62-82 49 36-14 46-25zm0 436-109-96 23 31 86 87zm-32 42-117-126 66 90 13 36z" opacity=".65"/>
    </g>
    <g opacity=".9" stroke={ink} strokeLinejoin="round">
      <path d="m406 540 36-82 31-17 8-42 41-25 24 7 27-17 42 8 29-11 39 14 37-19 48 7 30-42 38 5 30-20 26 10 36-42 60-51 57 7v310z" fill="#51444B" strokeWidth="5"/>
      <path d="m479 432 58-35 14 7m209-14 43-37 36 1m28-13 36-37 19 3" fill="none" stroke="#AC6A64" strokeWidth="3"/>
      <path d="m499 540 38-63 57-43 23-41 25 21 69 15 91 2 61-25 47-17v151z" fill="#283741" strokeWidth="5"/>
      <path d="m466 540 87-95 49-31 13-27 8 23 73 16 102 1 60-21 26-24 9-1-11 29-24 13-32 2-35 15-92 2-70-15-63 36-77 76z" fill="#42585A" strokeWidth="4"/>
      <path d="m530 476 48-36m212-8 51-15m19-4 15-11" stroke="#81A49A" strokeWidth="2.5"/>
      <path d="m763 462 73-14v27l-73 10zm88-18 28-8v30l-28 9zm41-11 34-13v31l-34 12z" fill="#BD7363" strokeWidth="3"/>
    </g>
    <path d="m711 73 21-28m17 14 20-38m81 160 60-29m-44 42 82-24m-291 258-29 52m-18-41-48 57m290-194 83 18m-61-32 74 9" fill="none" stroke="#F7AD79" strokeWidth="2.8" strokeLinecap="round"/>
    <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
      {/* The long red sash and back leg trail away from the viewer. The nearer fist and
          boot have much wider silhouettes and shorter forearms / shins in perspective. */}
      <path d="M727 242q58-34 105-18 32 13 64 6 29-7 49-24l-12 19q30-8 57-30-11 26-43 41-61 33-102 17-46-16-98 14z" fill="#BE3348" strokeWidth="6"/>
      <path d="M751 248q47-27 91-10 43 16 86-5" fill="none" stroke="#FA6C60" strokeWidth="3.7"/>
      <path d="M749 256q26-1 49 13 32 20 67 17l20-5-16 13 26 2q-47 16-90-2l-41-14-22 1z" fill="#993747" strokeWidth="4.7"/>
      <path d="M739 248q27-6 48 13l30 29 28-11 19-24 18 1 7 15-19 36-51 24-20-3-46-24-42-24z" fill="#393447" strokeWidth="6"/>
      <path d="m770 269 21 7 32 30 31-15-18 18-20 8-29-13z" fill="#665269" strokeWidth="3"/>
      <path d="m855 263 9-13 12 5 8 13-9 9-18-3z" fill="#D7BE94" strokeWidth="3.3"/>
      <path d="m863 255 4-20 10-17 9-6 12 4 3 7-8 13 0 20-8 15-14-4z" fill="#272531" strokeWidth="4.5"/>
      <path d="m880 218 10-4 9 6-7 10-1 21" fill="none" stroke="#E0CDA2" strokeWidth="3.5"/>
      <path d="M704 234q-34 2-62 21l-25 33-3 20 12 12 52-9 30-15 32 4 21-26-14-26z" fill="#14747B" strokeWidth="6"/>
      <path d="m638 277-18 30 9 7 23-5 15-15 28-3 18-34z" fill="#123C48" stroke="none"/>
      <path d="m620 305 4 10 30-4 16-9 16-1" stroke={gold} strokeWidth="3.4" fill="none"/>
      <path d="M711 273q19 7 27 26l-1 22-19 27-37 37-29 41-27 10-23-15 16-36 34-49 14-39 16-21z" fill="#47384D" strokeWidth="6.5"/>
      <path d="m723 304-8 23-40 48-16 33 19-21 40-36 20-31-3-18z" fill="#292734" strokeWidth="2.5"/>
      <path d="m670 351 15-34 14-12 16-2-23 15-4 25-24 33z" fill="#7C6075" stroke="none"/>
      <path d="m615 390 39 16-5 16-41 8-16-9z" fill="#DFC49A" strokeWidth="4"/>
      <path d="m600 409 24-8 30 12-4 20-19 17-23 23-47 10-29-7-3-15 16-18 28-14z" fill="#292633" strokeWidth="6"/>
      <path d="m585 430-12 16-27 13-8 11 22 4 44-10 20-21-24 5 18-18-10-9z" fill="#5F5262" strokeWidth="3"/>
      <path d="m535 464 1 8 23 6 45-10 29-28 13-8" stroke="#E1C49D" strokeWidth="4.5" fill="none"/>
      <path d="m578 439 17 7m-25 1 15 6m-26 0 13 4" stroke={ink} strokeWidth="3"/>
      <path d="M704 157q23-12 48-6l27 14 11 23-13 29-19 22-10 36-30-4-29 9-34-15-5-18 9-29-6-22 13-24z" fill="#147C82" strokeWidth="6.5"/>
      <path d="m737 161 21-3 16 12-9 18-15 17-10 32 5 17-10 12-25-4 4-24 20-28 9-21z" fill="#153E4B" stroke="none"/>
      <path d="m671 178 13-11 11 3-19 16 4 24-13 20-11 8 4-18-6-20z" fill="#51C0B0" stroke="none"/>
      <path d="m680 224 27-15-19 23-14 16 12 8-24-2-4-8z" fill="#15505B" stroke="none"/>
      <path d="m699 163-13 11 5 26 12 10 5-9-8-19z" fill={ivory} strokeWidth="3.4"/>
      <path d="m726 155 13 8-5 22-25 27-26 19-24 14 2-11 33-28 24-27z" fill="#EBD2A1" strokeWidth="3.4"/>
      <path d="m731 169-8 17-30 30" fill="none" stroke="#AB9179" strokeWidth="2"/>
      <path d="m663 242 28 7 31-3 30-14 7 15-24 16-36 7-39-13z" fill="#EB4B58" strokeWidth="4.4"/>
      <path d="m676 251 19 6 28-6m8-3 20-10" fill="none" stroke="#913140" strokeWidth="2.7"/>
      <path d="m735 247 15-8 13 7-3 15-17 6-11-9z" fill="#CC3C4D" strokeWidth="3.5"/>
      <path d="M723 261q17 6 31-4l28 11 30 27 36 8-23 9 22 1-40 14-32-15-36-3-24-10z" fill="#19616D" strokeWidth="5"/>
      <path d="m748 264 20 8 34 29 25 6-20 7-28-15-30-8z" fill="#123B48" stroke="none"/>
      <path d="m739 305 29 3 40 15 22-7" fill="none" stroke={gold} strokeWidth="3"/>
      <path d="m772 302 9 1 9 7 7 1-5-7 7 1 8 8 11 0" fill="none" stroke="#D6BD79" strokeWidth="2.2"/>
      <path d="m770 159 19-9 27 7 20 14 20 7-2 17-23 6-31-12-14 10-19-16z" fill="#1C6B74" strokeWidth="5.5"/>
      <path d="m774 169 14-11 22 4 15 10-24-1-16 9z" fill="#56B8A7" stroke="none"/>
      <path d="m795 182 16-5 20 9 14-2-8 11-17-3-16-4z" fill="#123C48" stroke="none"/>
      <path d="m843 176 11-3 9 10-6 14-13-1-5-6z" fill="#D9BD91" strokeWidth="3.4"/>
      <path d="m852 177 14-15 12-8 15 4 6 9-6 12-19 5-13 9-9-7z" fill="#D1927E" strokeWidth="4"/>
      <path d="m861 167 11-8 10 17-10 10-8-6z" fill="#CE4450" strokeWidth="3.2"/>
      <path d="m868 165 9 15m-5-17 9 13m3-19 5 7m-3 0 8 4" fill="none" strokeWidth="2"/>
      <path d="m707 152 21-13 17 7-10 21-11 12-16-2-9-10z" fill="#BD8275" strokeWidth="4.5"/>
      <path d="m721 159 15-11-5 14-9 6z" fill="#815D67" stroke="none"/>
      <path d="M733 95q1-36 30-50 25-15 69-6 35 6 61-4 19-8 34-26-4 17-18 34l17-7q-21 26-59 34-20 4-42 2l17 7q-32 5-59-3l-17 3-21 27z" fill="#25212D" strokeWidth="6"/>
      <path d="M748 82q17-35 51-37 26-1 45 5 30 4 54-7-20 17-53 16l-38-3q-30 0-50 26z" fill="#605062" stroke="none"/>
      <path d="m748 69 10 5-6 19-14 4-5-8z" fill={red} strokeWidth="4"/>
      <path d="M686 122q-1-22 13-35 18-15 37-11l20 13 11 22-5 21-14 14-12 12-20 11-13-3-10-12-4-15-7-3z" fill="#D49B86" strokeWidth="5.5"/>
      <path d="m691 126 5-17 19-9 13 8-11 17-17 10 4 18 11 7 11-4-12 8-9-4-11-14z" fill="#F2C29C" stroke="none"/>
      <path d="m730 149 8-18 13-12-1 12-8 13-14 12-14 8 14-14z" fill="#9A6B70" stroke="none"/>
      <path d="M677 129q1-22 17-40 18-22 40-19 17 1 29 17l7 23-9 22-13 9 2-21-10-11-6 15 1-22-22 12-24 5-1 12-5-7-9 9z" fill="#26222B" strokeWidth="5.3"/>
      <path d="M687 110q18-31 47-29l15 5-23 2-17 10 14-3-18 12z" fill="#675666" stroke="none"/>
      <path d="m689 128 10-5 9 2-4 6-7 3zm27-8 13-12 9 0-5 8-11 8z" fill={ink} stroke="none"/>
      <path d="m693 130 9-3-3 4zm28-9 11-8-3 6z" fill={ivory} stroke="none"/>
      <path d="m708 129-4 12 5 1m2 9 12-5-9 7z" fill="none" strokeWidth="2.4"/>
      <path d="m751 126 5-7 4 1-2 7-6 4" fill="#CE937B" strokeWidth="2.5"/>
      <path d="m666 171-20 5-28 29-23 10 8 24 30 6 22-13 21-18 7-22z" fill="#21838A" strokeWidth="6"/>
      <path d="m670 177-18 6-23 26-15 7 9 4 17-7 19-21z" fill="#62C6AE" stroke="none"/>
      <path d="m674 204-22 15-14 4-11 15 17-2 24-18z" fill="#123847" stroke="none"/>
      <path d="m625 211 14 17-11 17-22-2-10-22z" fill="#DFCA9D" strokeWidth="4"/>
      <path d="m602 212-21 0-16 13-3 22 15 16 27 1 22-15 1-15-10-18z" fill="#E54B59" strokeWidth="5"/>
      <path d="m584 215 10 10 17 31m-35-32 12 9 15 25m-29-23 10 8 8 15" fill="none" stroke="#7F3546" strokeWidth="3.5"/>
      <path d="m565 209 12-3 14 6 14 17 4 21-7 14-19 11-30 6-18-3-14-13-5-16 5-13 1-12 12-8 13-1 7-6z" fill="#E9A88F" strokeWidth="6.2"/>
      <path d="m524 241 11-8 16 4 13 11 9 1 9-4 11 5-4 13-15 8-23 4-15-4-11-11z" fill="#C1857E" stroke="none"/>
      <path d="m527 229 10-7 10 1 10 9-1 5-12-7-13 4zm19-8 11-5 9 1 8 9-1 5-10-9-11 4zm29-5 8-1 12 14-2 5-9-12z" fill="#FBE0AC" stroke="none"/>
      <path d="m522 241 10-7 13 0 12 8m-14-17 9 0 14 13m-4-20 10 1 10 12m-24 25 14 8 16-5 10-12-8-7-11 6-10-3m-39 13 13 9 10 0" fill="none" strokeWidth="3.3"/>
      <path d="m650 214 18-14-7 12-15 11zm92 62 26 10 21 17-41-13zm-86 109 15-31 13-9-11 25z" fill="url(#gc-coat-tone)" stroke="none"/>
    </g>
    <g fill="none" stroke="#F8DEAC" strokeLinecap="round" opacity=".85"><path d="m561 290-34 29m41-22-19 22m295-98 54-15m-30 19 31-7m-68-130 31-20" strokeWidth="2.3"/></g>
    <path d="M0 0h444l-32 43 36-16-42 58 35-21-36 60 39-15-31 46 44-20-40 66 44-19-34 53 21-7-39 65 43-23-34 54 39-17-42 65 55-27-55 79 48-29-62 97 44-24-39 54H0z" fill={ink}/>
    <path d="m422 0-23 43 17-10-56 89 16-10-52 88 91-117-16 7 39-66-15 8 24-32zm-10 341-77 111 28-19-65 107h39l74-144-27 23 49-87z" fill="#24212A"/>
    <g fill={ink}><path d="m1000 472-26-39-28-15-32 1-27 11-18 26-7 27-25 13-26 45h189z"/><path d="m868 460-12 5-3 12 7 11 12-1zm111 3 12-7 9 2v25l-14 6z"/></g>
    <path d="m900 451 10-10 16-1 11 8-12 9-14 1z" fill="#A66C8D"/><path d="m918 443 4 6-6 5-4-5z" fill={gold}/>
  </Plate>;
}

type ComicPanel = {
  id: string;
  Art: ComponentType;
  caption: string;
  description: string;
};

// The printed plates are assigned by id in comic-plates.ts. These illustrations and
// the plain-text captions keep a panel readable if its local image cannot be decoded.
export const comicPanels: ComicPanel[] = [
  {
    id: 'street', Art: RainStreet,
    caption: "MIDNIGHT IN CHINATOWN. THE NEON LIGHTS CAN'T KEEP THE SHADOWS OUT.",
    description: 'Red lanterns light a rain-slick Chinatown street. Shadows creep between the buildings.',
  },
  {
    id: 'crash', Art: LanternCrash,
    caption: 'THEY THOUGHT THESE STREETS HAD NO ONE LEFT TO FIGHT BACK.',
    description: 'CRASH!! A purple monster with an eye in its forehead smashes a red lantern.',
  },
  {
    id: 'roof', Art: RoofWatch,
    caption: 'NOT ON MY WATCH.',
    description: 'SHING!! A ponytailed heroine in a teal robe watches from the rooftops. Her blade catches the light.',
  },
  {
    id: 'leap', Art: StreetLeap,
    caption: 'GUARDIAN OF CHINATOWN',
    description: 'The heroine leaps from the roof into the street, ready to fight.',
  },
];
