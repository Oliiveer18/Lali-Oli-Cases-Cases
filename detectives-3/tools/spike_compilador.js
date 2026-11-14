// SPIKE (v0.7.11, preparación de la fase 3): demuestra que un caso MÍNIMO (2 salas de relleno, 4 sospechosos) pasa
// G.validateCase y G.reviewCase. Es la referencia viva de lo que debe producir el compilador de la fase 3D
// (biblia → def). No es parte del juego. Uso: node tools/spike_compilador.js
const G = require('./load_g.js')();
const room=(name,doorId,toRoom,toDoor,props)=>({name,floor:'wood',map:['##############','#............#','#............#','#............#','#............#','#............#','#............#','#............#','##############'],
  props,doors:[{id:doorId,x:6,y:0,wall:'n',sprite:'door',to:{room:toRoom,door:toDoor},label:'Puerta'}]});
const prop=(id,x,y,clue,text,sprite)=>({id,sprite:sprite||'crate',x,y,solid:true,label:id,shimmer:true,steps:[{tool:null,who:'rex',text,clue}],doneText:'Ya lo has examinado.'});
const clues={
 huella:{title:'Huella',icon:'ico_lupa',kind:'física',text:'Una huella reciente junto a la caja.',sus:{ana:5}},
 recibo:{title:'Recibo',icon:'paper',kind:'documento',text:'Un recibo a nombre de Ana de esa noche.',sus:{ana:5}},
 llave:{title:'Llave copiada',icon:'ico_key',kind:'física',text:'Una llave duplicada escondida.',sus:{ana:4}},
 guante:{title:'Guante ajeno',icon:'ico_clue',kind:'física',text:'Un guante que no es de Ana.',sus:{beto:2}},
 nota:{title:'Nota rota',icon:'paper',kind:'documento',text:'Una nota arrugada de Carla y Dani.',sus:{carla:2,dani:2}},
 ticket:{title:'Ticket de bus',icon:'paper',kind:'documento',text:'Ticket sellado: Beto estaba lejos.',sus:{}},
 foto:{title:'Foto de cámara',icon:'ico_rec',kind:'grabación',text:'Foto con hora: Carla fuera a esa hora.',sus:{}},
 testigo:{title:'Testimonio de Dani',icon:'ico_star',kind:'testimonio',text:'Dani vio a Ana salir a las 23:40.',sus:{ana:4}},
};
const sus=(id,name,look,cleared)=>({id,name,desc:name+', sospechoso.',look,clearedBy:cleared});
const npc=(name,look,liar,lieSay,truth,giveClue)=>({name,title:'Sospechoso',look,first:['Hola, soy '+name+'.'],
  topics:[{id:'coartada',label:'¿Dónde estuvo?',responses:[Object.assign({say:[liar?lieSay:truth]},liar?{fx:{flag:'lie_'+liar}}:{})]}].concat(giveClue?[{id:'visto',label:'¿Vio algo?',responses:[{say:['Sí, vi a Ana salir tarde.'],fx:{clue:giveClue}}]}]:[]),
  chat:[['Qué tiempo.']],press:[{say:['No me presione.']}],evidenceDefault:['Eso no me suena.'],evidence:{'*':[{say:['Vale, me pillaron.']}]}});
const def={id:'spike1',title:'Caso spike',client:'Cliente',blurb:'Caso mínimo de prueba.',level:2,parSeconds:600,reward:100,
 start:{room:'sala',p1:[6,7],p2:[7,7]},clientId:'cli',clues,
 suspects:[sus('ana','Ana','pimienta',[]),sus('beto','Beto','baguette',['ticket']),sus('carla','Carla','merengue',['foto']),sus('dani','Dani','hogaza',['ticket'])],
 solution:{culprit:'ana',method:'llave',motive:'dinero',
   methods:[{id:'llave',text:'Usó una llave copiada',needs:['llave']},{id:'ventana',text:'Entró por la ventana'}],
   motives:[{id:'dinero',text:'Dinero',needs:['recibo']},{id:'celos',text:'Celos'}],
   proof:['huella','recibo','testigo']},
 lies:{ana:{flag:'lie_ana',refutedBy:['huella'],said:'Estaba en casa.'},beto:{flag:'lie_beto',refutedBy:['guante'],said:'No salí.'}},
 chapters:[{id:1,title:'Pistas',goals:[{id:'g1',text:'Busca pistas',clues:['huella','recibo','llave','guante','nota','ticket','foto'],min:4},{id:'g2',text:'Habla con todos',flags:['talked_ana','talked_beto','talked_carla','talked_dani'],min:4}]},
           {id:2,title:'Acusar',goals:[{id:'g3',text:'Acusa',flags:['case_closed']}]}],
 rooms:{sala:room('Sala','p_anexo','anexo','p_sala',[prop('caja',3,3,'huella','Huella junto a la caja.'),prop('mesa',9,3,'recibo','Un recibo.','table'),prop('baul',3,6,'guante','Un guante.'),prop('cajon',9,6,'nota','Una nota.','drawer')]),
        anexo:room('Anexo','p_sala','sala','p_anexo',[prop('estante',3,3,'llave','Una llave.'),prop('taquilla',9,3,'ticket','Un ticket.','locker'),prop('buzon',3,6,'foto','Una foto.'),])},
 placement:{cli:[{ch:1,room:'sala',x:6,y:5,face:'down'}],ana:[{ch:1,room:'sala',x:5,y:2,face:'down'}],beto:[{ch:1,room:'sala',x:8,y:5,face:'down'}],carla:[{ch:1,room:'anexo',x:6,y:5,face:'down'}],dani:[{ch:1,room:'anexo',x:8,y:5,face:'down'}]},
 npcs:{cli:{name:'Cliente',title:'Cliente',look:'cliente',first:['Ayúdenme.'],topics:[{id:'r',label:'¿Qué pasó?',responses:[['Algo desapareció.']]}],evidenceDefault:['Hmm.'],evidence:{'*':[['Interesante.']]}},
  ana:npc('Ana','pimienta','ana','Estaba en casa durmiendo.','',null),beto:npc('Beto','baguette','beto','Nunca salí.','',null),carla:npc('Carla','merengue',null,'','Yo estaba en el cine.',null),dani:npc('Dani','hogaza',null,'','Yo vi cosas.','testigo')},
 epilogue:{win:[{who:'rex',text:'Caso cerrado.'}],fail:[{who:'rex',text:'Nos equivocamos.'}]}};
const v=G.validateCase(def);console.log('VALID',v.ok,v.errors.slice(0,12),v.warnings.slice(0,6));
if(v.ok){const r=G.reviewCase(def);console.log('REVIEW',r.ok,r.fairness,r.findings.map(f=>f.sev+':'+f.code+' '+f.msg));}

if (!v.ok) process.exit(1);
