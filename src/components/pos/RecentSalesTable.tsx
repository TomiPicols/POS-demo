type Sale = {
  id: string;
  time: string;
  items: number;
  total: number;
  method: string;
};

type RecentSalesTableProps = {
  sales: Sale[];
};

const RecentSalesTable = ({ sales }: RecentSalesTableProps) => {
  return (
    <div className="bg-card border border-borderSoft rounded-2xl p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Ventas recientes (hoy)</div>
          <div className="text-xs text-textSoft">{sales.length} registros</div>
        </div>
        <button className="text-xs text-textSoft hover:text-text">Ver todo</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-textSoft uppercase">
              <th className="py-2 pr-4">Hora</th>
              <th className="py-2 pr-4">Items</th>
              <th className="py-2 pr-4">Método</th>
              <th className="py-2 pr-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-borderSoft/60">
                <td className="py-2 pr-4">{s.time}</td>
                <td className="py-2 pr-4">{s.items}</td>
                <td className="py-2 pr-4 capitalize">{s.method}</td>
                <td className="py-2 pr-4 text-right">${s.total.toLocaleString('es-CL')}</td>
              </tr>
            ))}
            {!sales.length && (
              <tr>
                <td className="py-4 text-xs text-textSoft" colSpan={4}>
                  Aún no hay ventas hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export type { Sale };
export default RecentSalesTable;
