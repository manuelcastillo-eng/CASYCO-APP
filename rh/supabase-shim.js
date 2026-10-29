/* CASYCO RH · conecta la app con Supabase.
   Imita la API que usaba la versión de Claude (window.claude.use("db"|"user"|"downloads")),
   así el código de la app no cambia. Datos en la tabla public.rh_docs (col, id, data). */
(function(){
"use strict";
const CFG=window.CASYCO_CFG||{};
const sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
window.casycoSB=sb;
let me=null;           /* renglón de app_usuarios */
let session=null;
const ready=(async()=>{
  const {data}=await sb.auth.getSession();session=data.session;
  if(!session){location.replace("../?m=rh&next="+encodeURIComponent(location.pathname));await new Promise(()=>{});}
  const {data:u,error}=await sb.from("app_usuarios").select("*").eq("user_id",session.user.id).maybeSingle();
  if(error||!u||!(u.modulos||[]).includes("rh")||!u.rol_rh){location.replace("../?sin=rh");await new Promise(()=>{});}
  me=u;barra();return true;})();
function barra(){const ins=()=>{const w=document.getElementById("who");if(!w||document.getElementById("cy-salir"))return;
  const b=document.createElement("span");b.style.cssText="display:inline-flex;gap:10px;align-items:center;margin-left:12px";
  const n=document.createElement("span");n.textContent=me.nombre||me.email||"";n.style.opacity=".8";
  const a=document.createElement("a");a.href="../";a.textContent="Inicio";a.style.cssText="color:inherit";
  const s=document.createElement("a");s.id="cy-salir";s.href="#";s.textContent="Salir";s.style.cssText="color:inherit";s.onclick=async e=>{e.preventDefault();await sb.auth.signOut();location.replace("../");};
  b.append(n,a,s);w.after(b);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ins);else ins();setTimeout(ins,800);}

/* ---------------- Base de datos ---------------- */
const rid=()=>{const c="abcdefghijklmnopqrstuvwxyz0123456789";let s="";for(let i=0;i<20;i++)s+=c[Math.floor(Math.random()*c.length)];return s;};
const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
const mkDoc=(id,data)=>({id,exists:data!=null,data:()=>clone(data)});
const mkSnap=rows=>{const docs=rows.map(r=>mkDoc(r.id,r.data));return{docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};};
function fail(e){const x=new Error(e&&e.message||"Error de base de datos");x.code=(e&&(e.code==="42501"||/row-level security|permission/i.test(e.message||"")))?"permission-denied":"db";throw x;}
/* cambios en vivo: un canal por colección, varios oyentes */
const chans={};
function watch(col,fn){let c=chans[col];
  if(!c){c=chans[col]={fns:new Set(),t:null};
    c.ch=sb.channel("rh:"+col).on("postgres_changes",{event:"*",schema:"public",table:"rh_docs",filter:"col=eq."+col},()=>{clearTimeout(c.t);c.t=setTimeout(()=>c.fns.forEach(f=>f()),120);}).subscribe();}
  c.fns.add(fn);return()=>{c.fns.delete(fn);};}
function query(col,filt,lim){let q=sb.from("rh_docs").select("id,data").eq("col",col);
  filt.forEach(([f,op,v])=>{const k="data->>"+f;if(op==="=="||op==="eq")q=q.eq(k,String(v));else if(op==="in")q=q.in(k,(v||[]).map(String));else if(op==="!=")q=q.neq(k,String(v));});
  return q.limit(lim||5000);}
function colRef(col,filt,lim){filt=filt||[];return{
  where:(f,op,v)=>colRef(col,filt.concat([[f,op,v]]),lim),
  limit:n=>colRef(col,filt,n),orderBy:()=>colRef(col,filt,lim),
  get:async()=>{await ready;const {data,error}=await query(col,filt,lim);if(error)fail(error);return mkSnap(data||[]);},
  onSnapshot:(cb,err)=>{let alive=true;const run=async()=>{await ready;const {data,error}=await query(col,filt,lim);if(!alive)return;if(error){err&&err(error);return;}cb(mkSnap(data||[]));};
    run();const un=watch(col,run);return()=>{alive=false;un();};},
  doc:id=>docRef(col,id||rid()),
  add:async d=>{const id=rid();await docRef(col,id).set(d);return{id};}};}
function docRef(col,id){const one=async()=>{await ready;const {data,error}=await sb.from("rh_docs").select("data").eq("col",col).eq("id",id).maybeSingle();if(error)fail(error);return data?data.data:null;};
  return{id,
  get:async()=>mkDoc(id,await one()),
  set:async d=>{await ready;const {error}=await sb.from("rh_docs").upsert({col,id,data:clone(d)??{},updated_at:new Date().toISOString(),updated_by:session.user.id},{onConflict:"col,id"});if(error)fail(error);},
  update:async d=>{await ready;const {error}=await sb.rpc("rh_merge",{p_col:col,p_id:id,p_patch:clone(d)??{}});if(error)fail(error);},
  delete:async()=>{await ready;const {error}=await sb.from("rh_docs").delete().eq("col",col).eq("id",id);if(error)fail(error);},
  onSnapshot:(cb,err)=>{let alive=true;const run=async()=>{try{const d=await one();if(alive)cb(mkDoc(id,d));}catch(e){err&&err(e);}};run();const un=watch(col,run);return()=>{alive=false;un();};},
  collection:c=>colRef(col+"/"+id+"/"+c)};}
const db={collection:p=>colRef(p),doc:p=>{const i=p.lastIndexOf("/");return docRef(p.slice(0,i),p.slice(i+1));}};

/* ---------------- Usuario ---------------- */
const user={
  id:async()=>{await ready;return session.user.id;},
  canEdit:async()=>{await ready;return ["dueno","rh","consulta"].includes(me.rol_rh);},
  isOwner:async()=>{await ready;return me.rol_rh==="dueno";},
  can:async()=>{await ready;return me.rol_rh!=="consulta";},
  profiles:async ids=>{await ready;const out={};if(!ids||!ids.length)return out;
    const {data}=await sb.from("app_usuarios").select("user_id,legacy_id,nombre,email");
    (data||[]).forEach(u=>{[u.user_id,u.legacy_id].filter(Boolean).forEach(k=>{if(ids.includes(k))out[k]={name:u.nombre||u.email||"Usuario"};});});return out;}};

/* ---------------- Descargas ---------------- */
const downloads={save:async({filename,data})=>{const url=URL.createObjectURL(data);const a=document.createElement("a");a.href=url;a.download=filename||"archivo";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return true;}};

window.claude={use:async n=>{if(n==="db"){await ready;return db;}if(n==="user"){await ready;return user;}if(n==="downloads")return downloads;return null;}};
})();
