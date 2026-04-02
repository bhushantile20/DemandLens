import React from 'react';
import { LayoutDashboard, Package, TrendingUp, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Inventory', icon: Package, path: '/items' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-lg relative z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          DemandLens
        </h1>
      </div>
      
      <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
