import React, { useState, useEffect } from 'react';
import { getDashboardSummary, getItems, getAlerts, runForecast, getItemForecast } from '../services/api';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Activity, Package, AlertTriangle, AlertCircle, RefreshCw, ChevronRight, Bell } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningForecast, setRunningForecast] = useState(false);
  
  // State for specific item forecast modal/chart
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemForecastData, setItemForecastData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, itemsRes, alertsRes] = await Promise.all([
        getDashboardSummary(),
        getItems(),
        getAlerts()
      ]);
      setSummary(sumRes.data);
      setItems(itemsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunForecast = async () => {
    setRunningForecast(true);
    try {
      await runForecast();
      await fetchData(); // Refresh data to immediately see the new DB calculations
    } catch (error) {
      console.error("Error running forecast:", error);
    } finally {
      setRunningForecast(false);
    }
  };

  const viewItemForecast = async (item) => {
    setSelectedItem(item);
    try {
      const res = await getItemForecast(item.id);
      // Map API array to Recharts format: [{ date: '2026-03-22', demand: 45 }]
      const formattedData = res.data.forecast.map(f => ({
        date: f.forecast_date,
        demand: parseFloat(f.predicted_demand)
      }));
      setItemForecastData(formattedData);
    } catch (error) {
      console.error("Error fetching line chart forecast:", error);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Formatting Pie Chart Data based on current stock
  const pieData = items.map(item => ({
    name: item.item_name,
    value: parseFloat(item.stock?.quantity_available || 0)
  }));

  // Formatting Bar Chart Data
  const barData = items.map(item => ({
    name: item.item_name,
    stock: parseFloat(item.stock?.quantity_available || 0),
    reorderLevel: parseFloat(item.stock?.reorder_level || 0)
  }));

  return (
    <div className="p-8 w-full font-sans max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1">Real-time inventory intelligence and forecasting.</p>
          </div>
          <button 
            onClick={handleRunForecast}
            disabled={runningForecast}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-70 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${runningForecast ? 'animate-spin' : ''}`} />
            {runningForecast ? 'Computing...' : 'Run Global Forecast'}
          </button>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Items</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.total_items || 0}</h2>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Package className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Low Stock</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.low_stock_count || 0}</h2>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Critical Alerts</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.reorder_now_count || 0}</h2>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Data Issues</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{summary?.issue_count || 0}</h2>
            </div>
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><Activity className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Charts & Alerts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Active Alerts Panel */}
          <div className="col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <Bell className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900">Active Alerts</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center mt-4">System operating normally.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, i) => (
                    <div key={i} className={`p-4 rounded-lg flex items-start gap-3 border ${alert.status === 'CRITICAL' ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                      <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.status === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{alert.item_name}</p>
                        <p className={`text-xs mt-1 ${alert.status === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'}`}>
                          {alert.explanation === 'reorder_now' ? `Will run out in ${alert.days_of_stock_left} days! Reorder ${alert.suggested_reorder_qty} units.` : `Stock is getting low. Watch closely.`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart Panel */}
          <div className="col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6" style={{ minWidth: 0 }}>
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">Current Stock vs Reorder Level</h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="stock" name="Actual Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reorderLevel" name="Safety Threshold" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Detailed Items Table with Interactive Forecast Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${selectedItem ? 'col-span-2' : 'col-span-3'}`}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Inventory Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 font-semibold">Item Name</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold">Risk Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.item_id} className={`hover:bg-slate-50 transition-colors ${selectedItem?.item_id === item.item_id ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.item_name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{item.stock?.quantity_available || 0}</span>
                        <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.risk_status === 'safe' && <span className="inline-flex bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold">Optimal</span>}
                        {item.risk_status === 'watch' && <span className="inline-flex bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">Watch</span>}
                        {item.risk_status === 'reorder_now' && <span className="inline-flex bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold">Reorder Needed</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => viewItemForecast(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 justify-end w-full"
                        >
                          View Forecast <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic 7-Day Line Chart appearing when Row is Clicked */}
          {selectedItem && (
            <div className="col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col" style={{ minWidth: 0 }}>
              <h3 className="font-bold text-slate-900 mb-1">{selectedItem.item_name} Forecast</h3>
              <p className="text-xs text-slate-500 mb-6">Predicted Demand (Next 7 Days)</p>
              
              <div style={{ width: '100%', height: 250 }}>
                {itemForecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={itemForecastData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} tickFormatter={(t) => t.substring(5)} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <Tooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="demand" name="Predicted Use" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="text-sm text-slate-400">
                    Run global forecast first to generate data.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
  );
}
