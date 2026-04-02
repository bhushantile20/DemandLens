import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import ItemsList from "./pages/ItemsList";
import ItemDetail from "./pages/ItemDetail";
import Alerts from "./pages/Alerts";
import DataQuality from "./pages/DataQuality";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="nav">
          <Link to="/">Dashboard</Link>
          <Link to="/items">Inventory</Link>
          <Link to="/alerts">Reorder Alerts</Link>
          <Link to="/data-quality">Data Quality</Link>
        </nav>

        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemsList />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/data-quality" element={<DataQuality />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
