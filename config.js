/* CASYCO · configuración compartida (portal, Compras y RH).
   Copia aquí los mismos datos que usa el tablero de Compras:
   Supabase → Project Settings → API → Project URL y anon public key. */
window.CASYCO_CFG = {
  supabaseUrl: "https://uwagkfbsvgrbqfkaovji.supabase.co",
  supabaseAnonKey: "sb_publishable_v1TC4aU1WXAKSFuN-QMY0w_oJn1VEuk",
  modulos: {
    compras: { nombre: "Filtro de compras", desc: "Órdenes de compra, autorizaciones, pagos y saldos por obra", url: "compras/" },
    rh:      { nombre: "Recursos Humanos",  desc: "Asistencia, caja chica, nómina, gastos fijos y pagos de la semana", url: "rh/" }
  }
};
