/* CASYCO · candado del módulo de Compras.
   Agrégalo en compras/index.html, justo antes del script principal de Compras:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.100.0/dist/umd/supabase.js"></script>   (si Compras ya lo carga, no lo repitas)
     <script src="../config.js"></script>
     <script src="../guard.js" data-modulo="compras"></script>
   Si el usuario no ha entrado o no tiene "compras" en sus módulos, lo regresa al inicio. */
(function(){
  var me=document.currentScript,mod=(me&&me.dataset.modulo)||"compras";
  document.documentElement.style.visibility="hidden";
  var C=window.CASYCO_CFG,sb=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
  sb.auth.getSession().then(function(r){var s=r.data.session;
    if(!s){location.replace("../?m="+mod);return;}
    return sb.from("app_usuarios").select("modulos").eq("user_id",s.user.id).maybeSingle().then(function(q){
      if(!q.data||(q.data.modulos||[]).indexOf(mod)<0){location.replace("../?sin="+mod);return;}
      document.documentElement.style.visibility="";});
  });
})();
