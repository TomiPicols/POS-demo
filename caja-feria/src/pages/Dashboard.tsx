const Dashboard = () => {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-textSoft">Overview</p>
        <h1 className="text-2xl font-semibold mt-1">Panel general</h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-card">
          <div className="text-xs text-textSoft">Ingresos hoy</div>
          <div className="text-2xl font-semibold mt-1">$0</div>
          <div className="text-xs text-textSoft mt-1">Pendiente de datos</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-card">
          <div className="text-xs text-textSoft">Ventas</div>
          <div className="text-2xl font-semibold mt-1">0</div>
          <div className="text-xs text-textSoft mt-1">Pendiente de datos</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-card">
          <div className="text-xs text-textSoft">Tickets promedio</div>
          <div className="text-2xl font-semibold mt-1">$0</div>
          <div className="text-xs text-textSoft mt-1">Pendiente de datos</div>
        </div>
        <div className="bg-card border border-borderSoft rounded-xl p-4 shadow-card">
          <div className="text-xs text-textSoft">Clientes</div>
          <div className="text-2xl font-semibold mt-1">0</div>
          <div className="text-xs text-textSoft mt-1">Pendiente de datos</div>
        </div>
      </div>

      <div className="bg-card border border-borderSoft rounded-xl p-6 shadow-card">
        <h2 className="text-lg font-semibold">Actividad reciente</h2>
        <p className="text-sm text-textSoft mt-2">
          Aún no hay datos de actividad. Integra las métricas cuando estén listas.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
